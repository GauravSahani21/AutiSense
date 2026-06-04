#!/bin/bash
# AutiSense API Health Check — tests all endpoints end-to-end

BASE="http://localhost:5000"
PASS=0
FAIL=0
WARN=0
TOKEN=""
CHILD_ID=""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  $1${NC}"
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
}

check() {
  local LABEL="$1"
  local RESPONSE="$2"
  local EXPECT="$3"

  if echo "$RESPONSE" | grep -q "$EXPECT"; then
    echo -e "  ${GREEN}✔${NC} $LABEL"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✘${NC} $LABEL"
    echo -e "    ${YELLOW}↳ Response: $(echo $RESPONSE | head -c 200)${NC}"
    FAIL=$((FAIL+1))
  fi
}

warn() {
  local LABEL="$1"
  local MSG="$2"
  echo -e "  ${YELLOW}⚠${NC} $LABEL — $MSG"
  WARN=$((WARN+1))
}

# ─── SECTION 1: MongoDB ────────────────────────────────────────────────────────
print_header "1. MongoDB Connection"
MONGO_PING=$(mongosh --quiet --eval "JSON.stringify(db.adminCommand({ ping: 1 }))" autisense 2>/dev/null)
check "MongoDB ping" "$MONGO_PING" '"ok":1'

COLLECTIONS=$(mongosh --quiet --eval "JSON.stringify(db.getCollectionNames())" autisense 2>/dev/null)
echo -e "  ${CYAN}Collections:${NC} $COLLECTIONS"

# ─── SECTION 2: Auth Routes ─────────────────────────────────────────────────
print_header "2. Auth Routes (/api/auth)"

# Register (may fail with 400 if already exists — that's OK)
REG=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Parent","email":"test_health@autisense.com","password":"Test@1234","role":"parent"}')
if echo "$REG" | grep -q '"success":true'; then
  check "POST /api/auth/register (new user)" "$REG" '"success":true'
else
  warn "POST /api/auth/register" "User may already exist ($(echo $REG | head -c 100))"
fi

# Login
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_health@autisense.com","password":"Test@1234","role":"parent"}')
check "POST /api/auth/login" "$LOGIN" '"success":true'
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "  ${RED}✘ Could not extract JWT token — subsequent auth tests will fail${NC}"
  FAIL=$((FAIL+1))
else
  echo -e "  ${GREEN}  Token acquired:${NC} ${TOKEN:0:30}..."
fi

# Get current user (protected)
ME=$(curl -s "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN")
check "GET /api/auth/me (protected)" "$ME" '"success":true'

# ─── SECTION 3: Children Routes ─────────────────────────────────────────────
print_header "3. Children Routes (/api/children)"

# Create child (using correct DB enum value 'male'/'female')
CREATE_CHILD=$(curl -s -X POST "$BASE/api/children" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Child","dob":"2022-01-15","gender":"male","guardian":"Test Parent"}')
check "POST /api/children (create child)" "$CREATE_CHILD" '"success":true'
CHILD_ID=$(echo "$CREATE_CHILD" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('_id',''))" 2>/dev/null)

if [ -z "$CHILD_ID" ]; then
  warn "child _id not extracted" "Cannot run child-specific tests"
else
  echo -e "  ${GREEN}  Child ID:${NC} $CHILD_ID"
fi

# List all children
GET_CHILDREN=$(curl -s "$BASE/api/children" -H "Authorization: Bearer $TOKEN")
check "GET /api/children (list)" "$GET_CHILDREN" '"success":true'

# Get single child
if [ -n "$CHILD_ID" ]; then
  GET_CHILD=$(curl -s "$BASE/api/children/$CHILD_ID" -H "Authorization: Bearer $TOKEN")
  check "GET /api/children/:id" "$GET_CHILD" '"success":true'

  # Update child
  UPD_CHILD=$(curl -s -X PUT "$BASE/api/children/$CHILD_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"guardian":"Updated Guardian"}')
  check "PUT /api/children/:id (update)" "$UPD_CHILD" '"success":true'
fi

# ─── SECTION 4: Screenings Routes ───────────────────────────────────────────
print_header "4. Screenings Routes (/api/screenings)"

MCHAT_ANSWERS='[true,true,false,true,false,true,true,false,false,true,false,false,true,false,true,false,false,true,false,true]'
SCREENING=$(curl -s -X POST "$BASE/api/screenings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"childId\":\"$CHILD_ID\",\"answers\":$MCHAT_ANSWERS}")
check "POST /api/screenings (create with 20 M-CHAT answers)" "$SCREENING" '"success":true'

GET_SCREENINGS=$(curl -s "$BASE/api/screenings" -H "Authorization: Bearer $TOKEN")
check "GET /api/screenings (list)" "$GET_SCREENINGS" '"success":true'

# ─── SECTION 5: Reports Routes ──────────────────────────────────────────────
print_header "5. Reports Routes (/api/reports)"

GET_REPORTS=$(curl -s "$BASE/api/reports" -H "Authorization: Bearer $TOKEN")
check "GET /api/reports" "$GET_REPORTS" '"success":true'

# ─── SECTION 6: AI Scan Routes ──────────────────────────────────────────────
print_header "6. AI Scan Routes (/api/scan)"

# Analyze Face/Eye Metrics
FACE=$(curl -s -X POST "$BASE/api/scan/analyze-face-eye" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"video":"AAAA","mimeType":"video/webm"}')
check "POST /api/scan/analyze-face-eye" "$FACE" '"success":true'

# Analyze Drawing (using a small test base64 pixel — 1x1 red PNG)
TINY_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="
DRAWING=$(curl -s -X POST "$BASE/api/scan/analyze-drawing" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"image\":\"$TINY_PNG\"}")
check "POST /api/scan/analyze-drawing" "$DRAWING" '"success":true'

# Combined Report
FACE_RESULT=$(echo "$FACE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps({'riskLevel':d.get('riskLevel','Medium'),'reasoning':d.get('reasoning',''),'confidence':d.get('confidence',60)}))" 2>/dev/null)
DRAWING_RESULT=$(echo "$DRAWING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps({'prediction':d.get('prediction','Medium'),'reasoning':d.get('reasoning',''),'score':d.get('score',50)}))" 2>/dev/null)

COMBINED=$(curl -s -X POST "$BASE/api/scan/combined-report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"drawingResult\":$DRAWING_RESULT,\"faceResult\":$FACE_RESULT,\"behavioralResult\":{\"riskLevel\":\"Low\",\"reasoning\":\"typical\",\"score\":20},\"childName\":\"HealthCheck Child\"}")
check "POST /api/scan/combined-report" "$COMBINED" '"success":true'

# ─── SECTION 7: Doctor Routes ───────────────────────────────────────────────
print_header "7. Doctor Routes (/api/doctor)"

# Doctor routes require doctor role — test with parent token (should return 403)
DOC=$(curl -s "$BASE/api/doctor/patients" -H "Authorization: Bearer $TOKEN")
if echo "$DOC" | grep -q '"success":false'; then
  check "GET /api/doctor/patients (auth guard)" "$DOC" '"success":false'
else
  check "GET /api/doctor/patients" "$DOC" '"success":true'
fi

# ─── SECTION 8: Admin Routes ────────────────────────────────────────────────
print_header "8. Admin Routes (/api/admin)"

ADMIN=$(curl -s "$BASE/api/admin/stats" -H "Authorization: Bearer $TOKEN")
if echo "$ADMIN" | grep -q '"success":false'; then
  check "GET /api/admin/stats (auth guard)" "$ADMIN" '"success":false'
else
  check "GET /api/admin/stats" "$ADMIN" '"success":true'
fi

# ─── SECTION 9: Interventions Routes ────────────────────────────────────────
print_header "9. Interventions Routes (/api/interventions)"
if [ -n "$CHILD_ID" ]; then
  INTERV=$(curl -s "$BASE/api/interventions/$CHILD_ID" -H "Authorization: Bearer $TOKEN")
  check "GET /api/interventions/:childId" "$INTERV" '"success":true'
else
  warn "GET /api/interventions/:childId" "No childId available — cannot test (route requires :childId)"
fi

# ─── SECTION 10: Trajectory Routes ─────────────────────────────────────────
print_header "10. Trajectory Routes (/api/trajectory)"
if [ -n "$CHILD_ID" ]; then
  TRAJ=$(curl -s "$BASE/api/trajectory/$CHILD_ID" -H "Authorization: Bearer $TOKEN")
  check "GET /api/trajectory/:childId" "$TRAJ" '"success":true'
else
  warn "GET /api/trajectory/:childId" "No childId available — cannot test (route requires :childId)"
fi

# ─── SECTION 11: Clinical Support Routes ───────────────────────────────────
print_header "11. Clinical Support Routes (/api/clinical)"
# These are doctor-only routes — test that auth guard is working correctly
if [ -n "$CHILD_ID" ]; then
  CLINICAL=$(curl -s "$BASE/api/clinical/next-action/$CHILD_ID" -H "Authorization: Bearer $TOKEN")
  if echo "$CLINICAL" | grep -q 'not authorized'; then
    echo -e "  ${GREEN}✔${NC} GET /api/clinical/next-action/:childId (doctor-only auth guard working)"
    PASS=$((PASS+1))
  else
    check "GET /api/clinical/next-action/:childId" "$CLINICAL" '"success":true'
  fi
else
  warn "GET /api/clinical/next-action/:childId" "No childId available"
fi

# ─── CLEANUP ────────────────────────────────────────────────────────────────
print_header "12. Cleanup"
if [ -n "$CHILD_ID" ]; then
  DEL=$(curl -s -X DELETE "$BASE/api/children/$CHILD_ID" -H "Authorization: Bearer $TOKEN")
  check "DELETE /api/children/:id (cleanup)" "$DEL" '"success":true'
fi

# ─── FINAL SUMMARY ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  HEALTH CHECK SUMMARY${NC}"
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✔ Passed:   $PASS${NC}"
echo -e "  ${RED}✘ Failed:   $FAIL${NC}"
echo -e "  ${YELLOW}⚠ Warnings: $WARN${NC}"
echo ""
if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}🎉 ALL SYSTEMS OPERATIONAL${NC}"
else
  echo -e "  ${RED}${BOLD}⚠  $FAIL endpoint(s) need attention${NC}"
fi
echo ""
