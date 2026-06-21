'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function GerarRenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const [header, setHeader] = useState({
    ren_number: '',
    origem: '',
    destino: '',
    sign1_name: '',
    sign1_role: '',
    sign2_name: '',
    sign2_role: '',
    sign3_name: '',
    sign3_role: ''
  });

  const searchDocuments = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    
    // Busca documentos no periodo e que AINDA NÃO ESTÃO em uma REN
    // Para simplificar a V1, trazemos os do periodo. 
    // Uma melhoria seria left join com ren_items onde ren_items.id is null.
    const { data, error } = await supabase
      .from('documents')
      .select('*, suppliers(name)')
      .gte('document_date', dateFrom)
      .lte('document_date', dateTo)
      .order('document_date', { ascending: true });

    if (data) {
      setDocuments(data);
      // Seleciona todos por padrão
      setSelectedDocs(new Set(data.map(d => d.id)));
    }
    setLoading(false);
  };

  const toggleDoc = (id: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocs(newSet);
  };

  const handleGenerate = async () => {
    if (selectedDocs.size === 0) {
      alert('Selecione pelo menos um documento.');
      return;
    }
    setSubmitting(true);

    // 1. Criar Header
    const { data: headerData, error: headerError } = await supabase.from('ren_headers').insert([{
      ren_number: header.ren_number,
      date_from: dateFrom,
      date_to: dateTo,
      origem: header.origem,
      destino: header.destino,
      sign1_name: header.sign1_name,
      sign1_role: header.sign1_role,
      sign2_name: header.sign2_name,
      sign2_role: header.sign2_role,
      sign3_name: header.sign3_name,
      sign3_role: header.sign3_role
    }]).select().single();

    if (headerError || !headerData) {
      alert('Erro ao criar cabeçalho da REN: ' + (headerError?.message || ''));
      setSubmitting(false);
      return;
    }

    // 2. Criar Items
    const itemsToInsert = Array.from(selectedDocs).map(docId => ({
      ren_header_id: headerData.id,
      document_id: docId
    }));

    const { error: itemsError } = await supabase.from('ren_items').insert(itemsToInsert);
    
    if (itemsError) {
      alert('Erro ao vincular documentos: ' + itemsError.message);
      setSubmitting(false);
      return;
    }

    // 3. Redirecionar para visualização/impressão
    router.push(`/ren/${headerData.id}`);
  };

  return (
    <div>
      <h1>Gerar REN</h1>
      <p className="subtitle">Selecione o período, preencha o cabeçalho e gere o relatório.</p>

      <div className="card">
        <div className="card-title">1. Cabeçalho e Período</div>
        <div className="grid-3" style={{ marginBottom: '12px' }}>
          <div className="field"><label>Número da REN</label><input value={header.ren_number} onChange={e => setHeader({...header, ren_number: e.target.value})} placeholder="ex: 441/26" /></div>
          <div className="field"><label>Data Inicial *</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required /></div>
          <div className="field"><label>Data Final *</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} required onBlur={searchDocuments} /></div>
        </div>
        <div className="grid-2" style={{ marginBottom: '12px' }}>
          <div className="field"><label>Origem</label><input value={header.origem} onChange={e => setHeader({...header, origem: e.target.value})} placeholder="OBRA SMART..." /></div>
          <div className="field"><label>Destino</label><input value={header.destino} onChange={e => setHeader({...header, destino: e.target.value})} placeholder="Sr. João..." /></div>
        </div>
        
        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={searchDocuments}>Buscar Lançamentos</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">2. Assinaturas</div>
        <div className="grid-3">
          <div>
            <div className="field"><label>Nome 1</label><input value={header.sign1_name} onChange={e => setHeader({...header, sign1_name: e.target.value})} /></div>
            <div className="field" style={{ marginTop: '8px' }}><label>Cargo 1</label><input value={header.sign1_role} onChange={e => setHeader({...header, sign1_role: e.target.value})} /></div>
          </div>
          <div>
            <div className="field"><label>Nome 2</label><input value={header.sign2_name} onChange={e => setHeader({...header, sign2_name: e.target.value})} /></div>
            <div className="field" style={{ marginTop: '8px' }}><label>Cargo 2</label><input value={header.sign2_role} onChange={e => setHeader({...header, sign2_role: e.target.value})} /></div>
          </div>
          <div>
            <div className="field"><label>Nome 3</label><input value={header.sign3_name} onChange={e => setHeader({...header, sign3_name: e.target.value})} /></div>
            <div className="field" style={{ marginTop: '8px' }}><label>Cargo 3</label><input value={header.sign3_role} onChange={e => setHeader({...header, sign3_role: e.target.value})} /></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">3. Seleção de Documentos</div>
        {loading ? <p>Buscando documentos...</p> : (
          documents.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Inc?</th>
                    <th>Data</th>
                    <th>Fornecedor</th>
                    <th>Nº Doc</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedDocs.has(d.id)} 
                          onChange={() => toggleDoc(d.id)}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </td>
                      <td>{new Date(d.document_date).toLocaleDateString('pt-BR')}</td>
                      <td>{d.suppliers?.name}</td>
                      <td>{d.document_number}</td>
                      <td>R$ {Number(d.total_amount).toFixed(2).replace('.', ',')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="btn-row" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={submitting}>
                  {submitting ? 'Gerando e Salvando...' : 'Visualizar e Salvar REN'}
                </button>
              </div>
            </div>
          ) : (
            <p className="hint">Preencha o período e clique em Buscar Lançamentos.</p>
          )
        )}
      </div>

    </div>
  );
}
