import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Gerador REN</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/">Dashboard</Link>
          <Link href="/fornecedores">Fornecedores</Link>
          <Link href="/documentos">Lançamentos (NF/Boletos)</Link>
          <Link href="/ren">Gerar REN</Link>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
