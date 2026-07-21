import { useState, useContext } from 'react';
import { AppContext } from './context/AppContext';
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

function ShtoBiznes() {
  const { darkMode } = useContext(AppContext);
  const [form, setForm] = useState({
    emri: '',
    kategoria: '',
    qyteti: '',
    lat: '',
    lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  const ndryshoFushën = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const dërgoTëDhënat = async (e) => {
    e.preventDefault();
    if (!form.emri || !form.kategoria || !form.qyteti || !form.lat || !form.lng) {
      setMesazhi({ tekst: 'Ju lutem plotësoni të gjitha fushat!', gabim: true });
      return;
    }

    setLoading(true);
    setMesazhi({ tekst: '', gabim: false });

    try {
      await addDoc(collection(db, "bizneset"), {
        emri: form.emri,
        kategoria: form.kategoria,
        qyteti: form.qyteti,
        lat: Number(form.lat),
        lng: Number(form.lng),
        krijuarMë: new Date().toISOString()
      });

      setMesazhi({ tekst: 'Biznesi u shtua me sukses live në hartë! 🎉', gabim: false });
      setForm({ emri: '', kategoria: '', qyteti: '', lat: '', lng: '' });
    } catch (error) {
      console.error("Gabim gjatë shtimit:", error);
      setMesazhi({ tekst: 'Ndodhi një gabim me Firebase. Provoni përsëri!', gabim: true });
    } finally {
      setLoading(false);
    }
  };

  // Stilet sipas temës (Dark/Light)
  const stiliSfondit = darkMode ? '#111827' : '#f3f4f6';
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';
  const stiliInputit = darkMode ? '#2d2d2d' : '#e5e7eb';

  return (
    <div style={{ backgroundColor: stiliSfondit, minHeight: 'calc(100vh - 145px)', padding: '40px 20px', fontFamily: 'sans-serif', color: stiliTekstit }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: stiliKartelës, padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: darkMode ? '1px solid #2d2d2d' : '1px solid #f2f2f7' }}>
        
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '800', textAlign: 'center' }}>Shto Biznes të Ri 🏢</h2>
        <p style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#8e8e93', textAlign: 'center' }}>Plotesoni te dhenat qe biznesi te shfaqet ne harte</p>

        {mesazhi.tekst && (
          <div style={{ padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '700', textAlign: 'center', backgroundColor: mesazhi.gabim ? '#ff3b3020' : '#34c75920', color: mesazhi.gabim ? '#ff3b30' : '#34c759', border: `1px solid ${mesazhi.gabim ? '#ff3b3040' : '#34c75940'}` }}>
            {mesazhi.tekst}
          </div>
        )}

        <form onSubmit={dërgoTëDhënat} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Emri i Biznesit</label>
            <input type="text" name="emri" value={form.emri} onChange={ndryshoFushën} placeholder="p.sh. Kafe Central" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '14px', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Kategoria</label>
            <input type="text" name="kategoria" value={form.kategoria} onChange={ndryshoFushën} placeholder="p.sh. Kafene, Restorant, Dyqan" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '14px', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Qyteti</label>
            <input type="text" name="qyteti" value={form.qyteti} onChange={ndryshoFushën} placeholder="p.sh. Prishtine, Prizren, Peje" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '14px', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Gjerësia (Latitude)</label>
              <input type="number" step="any" name="lat" value={form.lat} onChange={ndryshoFushën} placeholder="42.6629" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '14px', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3b82f6' }}>Gjatësia (Longitude)</label>
              <input type="number" step="any" name="lng" value={form.lng} onChange={ndryshoFushën} placeholder="21.1655" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid ' + stiliInputit, backgroundColor: stiliKartelës, color: stiliTekstit, fontSize: '14px', outline: 'none' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#3b82f6', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Duke u ruajtur...' : 'Regjistro Biznesin 🚀'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default ShtoBiznes;
