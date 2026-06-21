'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function PrintRenPage() {
  const params = useParams();
  const [ren, setRen] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!params.id) return;
      
      const { data: header } = await supabase
        .from('ren_headers')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (header) {
        setRen(header);
        
        const { data: docs } = await supabase
          .from('ren_items')
          .select('documents(*, suppliers(name))')
          .eq('ren_header_id', header.id);
          
        if (docs) {
          // Flatten
          setItems(docs.map(d => d.documents).sort((a: any, b: any) => new Date(a.document_date).getTime() - new Date(b.document_date).getTime()));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading) return <div style={{ padding: '20px' }}>Carregando impressão...</div>;
  if (!ren) return <div style={{ padding: '20px' }}>REN não encontrada.</div>;

  const total = items.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const now = new Date(ren.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});

  const formatData = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '';
  const formatMoeda = (v: number) => 'R$ ' + v.toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');

  return (
    <div id="preview-area" style={{ display: 'block' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Barra superior não-imprimível */}
        <div style={{ background: 'var(--color-primary)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="print-hidden">
          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>📄 Visualização — REN {ren.ren_number}</span>
          <div className="btn-row">
            <button className="btn btn-print" onClick={() => window.print()}>🖨 Imprimir / Salvar PDF</button>
            <button className="btn btn-secondary" onClick={() => window.history.back()}>Voltar</button>
          </div>
        </div>

        {/* Folha A4 */}
        <div style={{ padding: '16px', background: '#f0f4fa' }}>
          <div className="print-page">
            
            <div className="doc-header">
              <div>
                <div className="doc-title">Relação de N. Fiscal Enviada</div>
                <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>Gerado em: {now}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="doc-ren">{ren.ren_number ? 'REN: ' + ren.ren_number : ''}</div>
                <div className="doc-period">Período: {formatData(ren.date_from)} a {formatData(ren.date_to)}</div>
              </div>
            </div>

            <div className="doc-meta">
              <table>
                <tbody>
                  <tr><td className="lbl">ORIGEM:</td><td style={{ fontSize: '9px' }}>{ren.origem}</td></tr>
                  <tr><td className="lbl">DESTINO:</td><td style={{ fontSize: '9px' }}>{ren.destino}</td></tr>
                </tbody>
              </table>
            </div>

            <table className="nf-table">
              <thead>
                <tr>
                  <th style={{ width: '9%' }}>DATA</th>
                  <th style={{ width: '10%' }}>P. COMPRA</th>
                  <th style={{ width: '10%' }}>C. CUSTO</th>
                  <th style={{ width: '10%' }}>N. FISCAL</th>
                  <th style={{ width: '33%' }}>FORNECEDOR</th>
                  <th style={{ width: '10%' }}>VENCIMENTO</th>
                  <th style={{ width: '10%' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map(doc => (
                  <tr key={doc.id}>
                    <td className="tc">{formatData(doc.document_date)}</td>
                    <td className="tc">{doc.purchase_order}</td>
                    <td className="tc">{doc.cost_center}</td>
                    <td className="tc tb">{doc.document_number}</td>
                    <td className="tl">{doc.suppliers?.name}</td>
                    <td className="tc">{formatData(doc.due_date)}</td>
                    <td className="tr">{formatMoeda(Number(doc.total_amount))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="tr">TOTAL</td>
                  <td className="tr">{formatMoeda(total)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="sign-row">
              <div className="sign-block"><div className="sign-line"></div><div className="sign-name">{ren.sign1_name}</div><div className="sign-cargo">{ren.sign1_role}</div></div>
              <div className="sign-block"><div className="sign-line"></div><div className="sign-name">{ren.sign2_name}</div><div className="sign-cargo">{ren.sign2_role}</div></div>
              <div className="sign-block"><div className="sign-line"></div><div className="sign-name">{ren.sign3_name}</div><div className="sign-cargo">{ren.sign3_role}</div></div>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print-hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
