import { useEffect } from 'react';

function ChartGrid({ center }: { center: string }) {
  const B = ({ n }: { n: string }) => (
    <div style={{background:'white',border:'1px solid #cbd5e1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px',fontWeight:700,color:'#475569',overflow:'hidden',padding:'1px'}}>
      {n}
    </div>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gridTemplateRows:'1fr 1fr 1fr 1fr',gap:'1px',border:'1px solid #94a3b8',background:'#e2e8f0',width:'100%',height:'100%'}}>
      <B n="மீனம்"/><B n="மேஷம்"/><B n="ரிஷபம்"/><B n="மிதுனம்"/>
      <B n="கும்பம்"/>
      <div style={{gridColumn:'span 2',gridRow:'span 2',background:'#fff1f2',border:'1px solid #94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#b91c1c',fontSize:'10px',letterSpacing:'2px'}}>{center}</div>
      <B n="கடகம்"/>
      <B n="மகரம்"/><B n="சிம்மம்"/>
      <B n="தனுசு"/><B n="விருச்சிகம்"/><B n="துலாம்"/><B n="கன்னி"/>
    </div>
  );
}

const s = {
  sectionHead: {background:'#b91c1c',color:'white',fontWeight:900,padding:'2px 8px',fontSize:'9px',letterSpacing:'1px',textTransform:'uppercase' as const},
  row: {display:'flex',alignItems:'center',gap:'2px',fontSize:'9px',fontWeight:600,marginBottom:'2px'},
  line: {flex:1,borderBottom:'1px solid #64748b',minWidth:'20px',height:'11px'} as React.CSSProperties,
};

export default function BlankBiodataFormPrintPage() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  const Field = ({ label }: { label: string }) => (
    <div style={s.row}><b style={{whiteSpace:'nowrap'}}>{label} -</b><div style={s.line} /></div>
  );
  const Grid2 = ({ pairs }: { pairs: [string,string][] }) => (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 10px',padding:'3px 8px'}}>
      {pairs.map(([a,b]) => (
        <><Field key={a} label={a} /><Field key={b} label={b} /></>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #f1f5f9; }
        @media print {
          html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; overflow: hidden; background: white; }
          .no-print { display: none !important; }
          #blank-form {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Screen action bar */}
      <div className="no-print" style={{position:'fixed',top:0,left:0,right:0,zIndex:50,background:'#0f172a',color:'white',padding:'8px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontWeight:700,fontSize:'13px'}}>🖨️ Blank Biodata Form — S2S Matrimony</span>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={() => window.print()} style={{padding:'6px 16px',background:'#b91c1c',color:'white',fontWeight:800,fontSize:'11px',borderRadius:'6px',border:'none',cursor:'pointer'}}>🖨️ Print / Save as PDF</button>
          <button onClick={() => window.close()} style={{padding:'6px 14px',background:'#475569',color:'white',fontWeight:700,fontSize:'11px',borderRadius:'6px',border:'none',cursor:'pointer'}}>✕ Close</button>
        </div>
      </div>

      {/* Screen spacer */}
      <div className="no-print" style={{height:'48px'}} />

      {/* Outer screen wrapper */}
      <div style={{display:'flex',justifyContent:'center',padding:'16px',background:'#e2e8f0',minHeight:'calc(100vh - 48px)'}}>

        {/* THE FORM — guaranteed A4 single page */}
        <div id="blank-form" style={{
          width:'210mm', height:'297mm', minHeight:'297mm', maxHeight:'297mm',
          background:'white', border:'5px solid #b91c1c',
          padding:'5mm', display:'flex', flexDirection:'column', gap:'3px',
          overflow:'hidden', position:'relative', fontFamily:'Arial,sans-serif',
          boxSizing:'border-box', flexShrink:0
        }}>

          {/* Watermark */}
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.08,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
            <img src="/images/logo.png" alt="" style={{width:'500px',height:'500px',objectFit:'contain'}} />
          </div>

          {/* 1. Header */}
          <div style={{position:'relative',zIndex:1,display:'flex',justifyContent:'space-between',alignItems:'flex-start',borderBottom:'2px solid #b91c1c',paddingBottom:'3px'}}>
            <div>
              <div style={{background:'#b91c1c',color:'white',padding:'2px 10px',borderRadius:'4px',fontWeight:900,fontSize:'11px',display:'inline-block'}}>
                Regn No. - <span style={{color:'#fcd34d'}}>___________</span>
              </div>
              <div style={{fontSize:'10px',fontWeight:700,marginTop:'2px'}}>Regn Date - <span style={{fontWeight:900}}>___________</span></div>
            </div>
            <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
              <img src="/images/logo.png" alt="" style={{width:'44px',height:'44px',objectFit:'contain',borderRadius:'50%',border:'1px solid #fcd34d',marginBottom:'1px'}} />
              <div style={{fontSize:'20px',fontWeight:900,color:'#b91c1c',letterSpacing:'2px',fontFamily:'Georgia,serif'}}>S2S MATRIMONY</div>
              <div style={{fontSize:'8px',fontWeight:700,color:'#92400e',letterSpacing:'2px',textTransform:'uppercase'}}>(S2S Matrimony Group)</div>
              <div style={{fontSize:'9px',fontWeight:900,color:'#b91c1c',background:'#fff1f2',border:'1px solid #fecdd3',padding:'1px 8px',borderRadius:'3px',marginTop:'1px'}}>BRANCH - Chennai</div>
            </div>
            <div style={{textAlign:'right',fontSize:'9px',fontWeight:700}}>
              <div>Cell: <span style={{color:'#b91c1c',fontWeight:900}}>7358732151 / 7338712658</span></div>
              <div style={{color:'#1e40af',fontWeight:900}}>www.s2smatrimonygroup.com</div>
              <div>Govt Regn No - 842 / 18</div>
            </div>
          </div>

          {/* 2. Name */}
          <div style={{position:'relative',zIndex:1,border:'2px solid #b91c1c',background:'#fff1f2',padding:'3px 10px',display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontWeight:900,fontSize:'12px',color:'#b91c1c',whiteSpace:'nowrap'}}>Name -</span>
            <div style={{flex:1,borderBottom:'2px solid #94a3b8',height:'16px'}} />
          </div>

          {/* 3. Caste row */}
          <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',border:'2px solid #b91c1c'}}>
            {['Caste','Sub Caste','Gothram'].map((l,i) => (
              <div key={l} style={{padding:'2px 6px',background:'#fff7f7',borderLeft:i>0?'2px solid #b91c1c':'none',display:'flex',alignItems:'center',gap:'4px',fontSize:'9px',fontWeight:700}}>
                <b>{l} -</b><div style={{flex:1,borderBottom:'1.5px solid #94a3b8',height:'11px'}} />
              </div>
            ))}
          </div>

          {/* 4. Main body */}
          <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'7fr 5fr',gap:'6px',flex:1,minHeight:0,overflow:'hidden'}}>

            {/* Left col */}
            <div style={{display:'flex',flexDirection:'column',gap:'4px',overflow:'hidden'}}>
              <div style={{border:'2px solid #b91c1c'}}>
                <div style={s.sectionHead}>PERSONAL DETAILS</div>
                <Grid2 pairs={[['Date of Birth','Birth Place'],['Birth Time','Complexion'],['Birth Order','Height'],['Education','Education Details'],['Salary','Designation'],['Company Name','Job Location']]} />
              </div>
              <div style={{border:'2px solid #b91c1c'}}>
                <div style={s.sectionHead}>FAMILY DETAILS</div>
                <Grid2 pairs={[["Father's Name","Father's Job"],["Mother's Name","Mother's Job"],['Elder Brother','Married Elder Bro'],['Younger Brother','Married Younger Bro'],['Elder Sister','Married Elder Sis'],['Younger Sister','Married Younger Sis']]} />
              </div>
              <div style={{border:'2px solid #b91c1c'}}>
                <div style={s.sectionHead}>FINANCIAL & ANCESTRAL DETAILS</div>
                <Grid2 pairs={[['Resident','Property'],['Residence Place','Native Place']]} />
              </div>
            </div>

            {/* Right col */}
            <div style={{display:'flex',flexDirection:'column',gap:'4px',overflow:'hidden'}}>
              <div style={{border:'2px dashed #b91c1c',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',flex:'0 0 150px',borderRadius:'4px'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#ffe4e6',border:'2px dashed #fca5a5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 4px'}}>
                    <svg width="24" height="24" fill="none" stroke="#f87171" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <div style={{fontSize:'9px',fontWeight:900,color:'#b91c1c'}}>Passport Size Photo</div>
                  <div style={{fontSize:'8px',color:'#94a3b8',marginTop:'1px'}}>Paste Here</div>
                </div>
              </div>
              <div style={{border:'2px solid #b91c1c',flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                <div style={s.sectionHead}>RASI & DOSHAMS</div>
                <div style={{padding:'4px 8px',display:'flex',flexDirection:'column',gap:'4px',flex:1,justifyContent:'space-around'}}>
                  {['Rasi','Natchathiram','Natchathiram Padham','Lagnam','Dasa Irupu','Dosham'].map(f => (
                    <div key={f} style={s.row}><b style={{whiteSpace:'nowrap'}}>{f} -</b><div style={s.line} /></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Charts */}
          <div style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',height:'110px',flexShrink:0}}>
            {[{t:'RASI CHART (ராசி)',c:'RASI'},{t:'NAVAMSAM CHART (நவாம்சம்)',c:'NAVAMSAM'}].map(({t,c}) => (
              <div key={t} style={{border:'2px solid #b91c1c',background:'white',display:'flex',flexDirection:'column',padding:'3px'}}>
                <div style={{fontSize:'8px',fontWeight:900,color:'#b91c1c',textTransform:'uppercase',textAlign:'center',marginBottom:'2px'}}>{t}</div>
                <div style={{flex:1}}><ChartGrid center={c} /></div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
