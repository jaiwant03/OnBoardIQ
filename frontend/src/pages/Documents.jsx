import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Database,
  Trash2,
  Sparkles
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/documents.css';

const Documents = () => {
  const { addNotification } = useNotification();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState(''); // 'extracting', 'embedding', 'indexing', 'done'
  const [uploadError, setUploadError] = useState('');
  const [selectedDept, setSelectedDept] = useState('General');
  const [selectedCat, setSelectedCat] = useState('General');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentAPI.getDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadStage('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('department', selectedDept);
    formData.append('category', selectedCat);

    try {
      // Animated progress stages for visual feedback
      setTimeout(() => setUploadStage('extracting'), 600);
      setTimeout(() => setUploadStage('embedding'), 1400);
      setTimeout(() => setUploadStage('indexing'), 2200);

      const res = await documentAPI.uploadDocument(formData);
      setUploadStage('done');
      addNotification({
        title: 'Document Uploaded & Indexed 📄',
        message: `"${file.name}" indexed for autonomous RAG retrieval and task extraction.`,
        type: 'document',
        link: '/documents'
      });
      setTimeout(() => {
        setUploading(false);
        setUploadStage('');
        fetchDocuments();
      }, 1500);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Error processing and indexing document.');
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id) => {
    const docToDelete = documents.find((d) => d._id === id);
    try {
      await documentAPI.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      addNotification({
        title: 'Document Removed',
        message: `"${docToDelete?.title || docToDelete?.filename || 'Document'}" removed from knowledge base.`,
        type: 'document',
        link: '/documents'
      });
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  return (
    <div className="page-container">
      <div className="documents-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Knowledge Center & Policies
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Company documentation indexed into ChromaDB vector store for autonomous RAG retrieval, task generation, and verified answers.
          </p>
        </div>
      </div>

      {/* Upload Controls & Metadata */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Department:</span>
          <select
            className="form-select"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="General">General</option>
            <option value="HR">HR</option>
            <option value="IT">IT & Security</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Category:</span>
          <select
            className="form-select"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="General">General</option>
            <option value="HR">HR Policies</option>
            <option value="IT">IT Setup</option>
            <option value="Security">Security & MFA</option>
            <option value="Engineering">Engineering Standards</option>
            <option value="Training">Training & Learning</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={`dropzone-container ${isDragOver ? 'is-dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.txt,.md,.docx"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />

        <div className="dropzone-icon-ring">
          <UploadCloud size={32} />
        </div>

        <div className="dropzone-text">
          <h3>Upload Company Knowledge Document</h3>
          <p>
            Drag & Drop <strong>PDF</strong>, <strong>TXT</strong>, or <strong>DOCX</strong> files here or{' '}
            <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
              Browse Files
            </span>
          </p>
          <div className="dropzone-hint">
            Documents are chunked, vectorized via sentence-transformers, and indexed into ChromaDB.
          </div>
        </div>
      </div>

      {/* Live Indexing Stage Animation Card */}
      {uploading && (
        <div className="indexing-progress-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <strong style={{ color: 'var(--text-primary)' }}>
              {uploadStage === 'done' ? '✓ Document ready for AI search' : 'Processing Document into ChromaDB...'}
            </strong>
          </div>

          <div className="indexing-stages-row">
            <div
              className={`indexing-stage-step ${
                uploadStage === 'uploading'
                  ? 'active'
                  : ['extracting', 'embedding', 'indexing', 'done'].includes(uploadStage)
                  ? 'completed'
                  : ''
              }`}
            >
              <span className="stage-step-dot" />
              <span>1. Uploading file...</span>
            </div>

            <div
              className={`indexing-stage-step ${
                uploadStage === 'extracting'
                  ? 'active'
                  : ['embedding', 'indexing', 'done'].includes(uploadStage)
                  ? 'completed'
                  : ''
              }`}
            >
              <span className="stage-step-dot" />
              <span>2. Extracting text & sections...</span>
            </div>

            <div
              className={`indexing-stage-step ${
                uploadStage === 'embedding'
                  ? 'active'
                  : ['indexing', 'done'].includes(uploadStage)
                  ? 'completed'
                  : ''
              }`}
            >
              <span className="stage-step-dot" />
              <span>3. Generating dense embeddings...</span>
            </div>

            <div
              className={`indexing-stage-step ${
                uploadStage === 'indexing'
                  ? 'active'
                  : uploadStage === 'done'
                  ? 'completed'
                  : ''
              }`}
            >
              <span className="stage-step-dot" />
              <span>4. Indexing knowledge in ChromaDB...</span>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="auth-error-alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Documents Table */}
      <div className="docs-table-wrapper">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Category</th>
              <th>Department</th>
              <th>Status</th>
              <th>Vector Chunks</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem' }}>
                  <LoadingSkeleton height="40px" />
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No company documents uploaded yet. Upload a company policy or onboarding guide above to automatically index policies, extract actionable tasks, and build your curriculum.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <div className="doc-name-cell">
                      <div className="doc-icon-box">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div>{doc.title || doc.filename}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {doc.filename}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        doc.category === 'HR'
                          ? 'badge-hr'
                          : doc.category === 'IT'
                          ? 'badge-it'
                          : doc.category === 'Security'
                          ? 'badge-security'
                          : 'badge-engineering'
                      }`}
                    >
                      {doc.category}
                    </span>
                  </td>

                  <td>{doc.department}</td>

                  <td>
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} />
                      Indexed
                    </span>
                  </td>

                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {doc.chunkCount || 5} chunks
                    </span>
                  </td>

                  <td>
                    {new Date(doc.uploadDate || Date.now()).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      title="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Documents;
