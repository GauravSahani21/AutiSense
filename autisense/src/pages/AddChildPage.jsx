import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, Card, Btn, Input, useToast, BackBtn } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { children as childrenApi } from '../api';

export default function AddChildPage() {
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    name: '', dob: '', gender: 'Boy', guardian: '', photo: null
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleFile = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrs = {};
    if (!formData.name.trim()) newErrs.name = 'Child Name is required';
    if (!formData.dob) newErrs.dob = 'Date of Birth is required';
    if (!formData.guardian.trim()) newErrs.guardian = 'Guardian Name is required';

    if (Object.keys(newErrs).length > 0) {
      setErrors(newErrs);
      return;
    }

    setSaving(true);
    try {
      // Normalize display gender ('Boy'/'Girl') to DB enum ('male'/'female')
      await childrenApi.create({
        name: formData.name.trim(),
        dob: formData.dob,
        gender: formData.gender === 'Boy' ? 'male' : 'female',
        guardian: formData.guardian.trim(),
      });
      showToast(`${formData.name}'s profile added successfully!`, 'success');
      setTimeout(() => navigate('/parent'), 800);
    } catch (err) {
      showToast(err.message || 'Failed to add child', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {ToastComponent}
      
      <div style={{ width: '100%', maxWidth: 500, alignSelf: 'center' }}>
        <BackBtn onClick={() => navigate('/parent')} label="Back to Dashboard" />
        
        <Card className="animate-fadeInUp" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👶</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--dark)' }}>
              Add New Child
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
              Enter details to track their developmental progress.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Child's Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="e.g. Arjun Sharma" />
            
            <div className="grid-2">
              <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} error={errors.dob} />
              
              <div className="form-group">
                <label className="form-label">Gender</label>
                <div style={{ display: 'flex', gap: 8, height: 44 }}>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'Boy'})}
                    style={{
                      flex: 1, borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                      background: formData.gender === 'Boy' ? 'var(--orange)' : 'white',
                      color: formData.gender === 'Boy' ? 'white' : 'var(--mid)',
                      border: `1.5px solid ${formData.gender === 'Boy' ? 'var(--orange)' : 'var(--border)'}`,
                    }}
                  >Boy</button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'Girl'})}
                    style={{
                      flex: 1, borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                      background: formData.gender === 'Girl' ? 'var(--orange)' : 'white',
                      color: formData.gender === 'Girl' ? 'white' : 'var(--mid)',
                      border: `1.5px solid ${formData.gender === 'Girl' ? 'var(--orange)' : 'var(--border)'}`,
                    }}
                  >Girl</button>
                </div>
              </div>
            </div>

            <Input label="Guardian Name" name="guardian" value={formData.guardian} onChange={handleChange} error={errors.guardian} placeholder="e.g. Priya Sharma" />

            <div className="form-group">
              <label className="form-label">Photo (Optional)</label>
              <div style={{
                position: 'relative', width: '100%', padding: '12px 16px', border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{ padding: '6px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark)', cursor: 'pointer' }}>
                  Choose File
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formData.photo ? formData.photo.name : 'No file chosen'}
                </span>
                <input type="file" onChange={handleFile} accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>

            <Btn type="submit" size="lg" disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Adding Child...' : 'Add Child'}
            </Btn>
          </form>
        </Card>
      </div>
    </PageWrapper>
  );
}
