-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Fornecedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document_tax_id VARCHAR(50), -- CNPJ / CPF
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Documentos (Notas e Boletos)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('NOTA_FISCAL', 'BOLETO')),
    document_number VARCHAR(100) NOT NULL,
    document_date DATE NOT NULL,
    purchase_order VARCHAR(100),
    cost_center VARCHAR(100),
    due_date DATE,
    total_amount NUMERIC(15, 2) NOT NULL,
    origem_obra VARCHAR(255),
    destino VARCHAR(255),
    notes TEXT,
    attachment_path TEXT,
    created_by UUID, -- Se usar auth, referenciar auth.users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- REGRA DE NEGÓCIO: Restrição única composta contra duplicidade
    CONSTRAINT unique_supplier_doc_type UNIQUE (supplier_id, document_number, document_type)
);

-- Índices para otimizar filtros de busca
CREATE INDEX idx_documents_date ON documents(document_date);
CREATE INDEX idx_documents_supplier ON documents(supplier_id);
CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_documents_cost_center ON documents(cost_center);

-- Tabela de Cabeçalho das RENs
CREATE TABLE ren_headers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ren_number VARCHAR(100),
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    origem VARCHAR(255),
    destino VARCHAR(255),
    sign1_name VARCHAR(255),
    sign1_role VARCHAR(255),
    sign2_name VARCHAR(255),
    sign2_role VARCHAR(255),
    sign3_name VARCHAR(255),
    sign3_role VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens vinculados à REN
CREATE TABLE ren_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ren_header_id UUID REFERENCES ren_headers(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE RESTRICT,
    -- Impede que o mesmo documento entre duas vezes na mesma REN
    CONSTRAINT unique_ren_document UNIQUE (ren_header_id, document_id)
);
