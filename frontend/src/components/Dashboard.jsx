import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Folder, FileImage, Plus, LogOut, HardDrive, Upload, MoreVertical, Menu, X, CheckCircle, AlertCircle, Search, LayoutGrid, Clock } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const { folderId } = useParams();
  const navigate = useNavigate();
  
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');

  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editName, setEditName] = useState('');

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const folderRes = await api.get(`/folders/${folderId || 'null'}?page=${page}&limit=50`);
      setFolders(folderRes.data.folders);
      setCurrentFolder(folderRes.data.currentFolder);
      
      const imgRes = await api.get(`/images/${folderId || 'null'}?page=${page}&limit=50`);
      setImages(imgRes.data);
    } catch (err) {
      addToast('Failed to load contents', 'error');
    } finally {
      setLoading(false);
    }
  }, [folderId, page, addToast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getIdempotencyKey = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      await api.post('/folders', 
        { name: newFolderName, parentId: folderId || null },
        { headers: { 'x-idempotency-key': getIdempotencyKey() } }
      );
      setFolderModalOpen(false);
      setNewFolderName('');
      addToast('Folder created');
      fetchContents();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error creating folder', 'error');
    }
  };

  const handleUploadImage = async () => {
    if (!uploadFile) return;
    try {
      addToast('Uploading...', 'success');
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      formData.append('folderId', folderId || 'null');

      await api.post('/images', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-idempotency-key': getIdempotencyKey()
        }
      });
      setImageModalOpen(false);
      setUploadFile(null);
      setUploadName('');
      addToast('Upload complete');
      fetchContents();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error uploading image', 'error');
    }
  };

  const handleRename = async () => {
    if (!editName || !editItem) return;
    try {
      const endpoint = editItem.type === 'folder' ? `/folders/${editItem.id}` : `/images/${editItem.id}`;
      await api.put(endpoint, 
        { name: editName },
        { headers: { 'x-idempotency-key': getIdempotencyKey() } }
      );
      setEditItem(null);
      setEditName('');
      addToast('Renamed successfully');
      fetchContents();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error renaming', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const endpoint = deleteItem.type === 'folder' ? `/folders/${deleteItem.id}` : `/images/${deleteItem.id}`;
      await api.delete(endpoint, {
        headers: { 'x-idempotency-key': getIdempotencyKey() }
      });
      setDeleteItem(null);
      addToast('Deleted successfully');
      fetchContents();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error deleting', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const openEdit = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setEditItem({ id: item._id, type });
    setEditName(item.name);
    setActiveMenuId(null);
  };

  const openDelete = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteItem({ id: item._id, type, name: item.name });
    setActiveMenuId(null);
  };

  const Skeletons = () => (
    <>
      <div className="section-title skeleton" style={{ width: '150px', height: '28px', marginBottom: '24px', borderRadius: '8px' }}></div>
      <div className="grid-container">
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
      </div>
    </>
  );

  return (
    <>
      <div className="bg-blobs">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>
      <div className="app-container">
        
        {/* Mobile Sidebar Overlay */}
        <div className={`modal-overlay ${isSidebarOpen ? '' : 'hidden'}`} style={{display: isSidebarOpen ? 'flex' : 'none', zIndex: 40}} onClick={() => setSidebarOpen(false)}></div>
        
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="logo">
            <HardDrive className="icon-gradient" size={28} />
            <span className="brand-text">Drive</span>
            {isSidebarOpen && <X style={{marginLeft: 'auto', cursor:'pointer'}} onClick={() => setSidebarOpen(false)} />}
          </div>
          
          <button className="new-btn" onClick={() => { setFolderModalOpen(true); setSidebarOpen(false); }}>
            <Plus size={20} /> Create New
          </button>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
            <div className="nav-link active" onClick={() => navigate('/')}>
              <LayoutGrid size={20} /> My Drive
            </div>
            <div className="nav-link">
              <Clock size={20} /> Recent
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            <button className="new-btn" style={{background: 'var(--surface-solid)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none'}} onClick={() => { setImageModalOpen(true); setSidebarOpen(false); }}>
              <Upload size={18} /> Upload Image
            </button>
            <div className="nav-link" onClick={logout} style={{ marginTop: '16px', color: 'var(--danger-color)' }}>
              <LogOut size={20} /> Logout
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="topbar">
            <div className="breadcrumbs">
              <Menu className="hamburger-btn" size={28} style={{display: 'block', marginRight: '16px', cursor:'pointer'}} onClick={() => setSidebarOpen(true)} />
              <span onClick={() => navigate('/')}>My Drive</span>
              {currentFolder && (
                <>
                  <span style={{color: 'var(--border-color)', margin: '0 8px'}}>/</span>
                  <span>{currentFolder.name}</span>
                </>
              )}
            </div>
            
            <div className="search-bar">
              <Search size={18} color="var(--text-secondary)" />
              <input type="text" placeholder="Search in Drive..." />
            </div>

            <div className="user-profile">
              <div className="avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>

          <div className="content-area">
            {loading ? <Skeletons /> : (
              <>
                {folders.length > 0 && (
                  <>
                    <div className="section-title">Folders</div>
                    <div className="grid-container">
                      {folders.map((f, i) => (
                        <div key={f._id} style={{ position: 'relative', animationDelay: `${i * 0.05}s` }}>
                          <Link to={`/folder/${f._id}`} className="item-card">
                            <div className="icon-wrapper">
                              <Folder fill="currentColor" size={28} />
                            </div>
                            <div className="item-info">
                              <span className="item-name">{f.name}</span>
                              <span className="item-size">{formatSize(f.size)} • Folder</span>
                            </div>
                          </Link>
                          <button className="item-options-btn" onClick={(e) => toggleMenu(e, f._id)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)'}}>
                            <MoreVertical size={20} />
                          </button>
                          {activeMenuId === f._id && (
                            <div className="options-menu">
                              <button onClick={(e) => openEdit(e, f, 'folder')}>Rename</button>
                              <button className="danger-text" onClick={(e) => openDelete(e, f, 'folder')}>Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {images.length > 0 && (
                  <>
                    <div className="section-title" style={{ marginTop: '16px' }}>Files</div>
                    <div className="grid-container">
                      {images.map((img, i) => (
                        <div key={img._id} style={{ position: 'relative', animationDelay: `${i * 0.05}s` }}>
                          <a href={img.url} target="_blank" rel="noreferrer" className="item-card">
                            <div className="image-preview">
                              <img src={img.url} alt={img.name} />
                            </div>
                            <div className="item-info">
                              <span className="item-name">{img.name}</span>
                              <span className="item-size">{formatSize(img.size)} • Image</span>
                            </div>
                          </a>
                          <button className="item-options-btn" onClick={(e) => toggleMenu(e, img._id)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)'}}>
                            <MoreVertical size={20} />
                          </button>
                          {activeMenuId === img._id && (
                            <div className="options-menu">
                              <button onClick={(e) => openEdit(e, img, 'image')}>Rename</button>
                              <button className="danger-text" onClick={(e) => openDelete(e, img, 'image')}>Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {folders.length === 0 && images.length === 0 && (
                  <div style={{textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)', animation: 'fadeIn 0.5s'}}>
                    <div style={{ background: 'var(--surface-solid)', padding: '60px', borderRadius: 'var(--radius-xl)', display: 'inline-block', boxShadow: 'var(--shadow-sm)', border: '2px dashed var(--border-color)' }}>
                      <div style={{ width: '80px', height: '80px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                        <HardDrive size={40} color="var(--primary-color)" />
                      </div>
                      <h2 style={{margin: '0 0 12px 0', color: 'var(--text-primary)', fontFamily: 'Outfit'}}>This folder is empty</h2>
                      <p style={{margin: 0, fontSize: '1.05rem'}}>Drag files here or use the "Create New" button to add content.</p>
                      <button className="btn-primary" style={{marginTop: '24px'}} onClick={() => setFolderModalOpen(true)}>Create Folder</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pagination Controls */}
            {(!loading && (folders.length === 50 || images.length === 50 || page > 1)) && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <button disabled={folders.length < 50 && images.length < 50} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </div>
        </div>

        {/* Toasts */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast`} style={{ background: t.type === 'success' ? '#10b981' : 'var(--danger-color)' }}>
              {t.type === 'success' ? <CheckCircle size={20} color="white" /> : <AlertCircle size={20} color="white" />}
              {t.message}
            </div>
          ))}
        </div>

        {/* Modals */}
        {isFolderModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Create New Folder</h3>
              <input 
                type="text" 
                placeholder="Folder Name e.g. Documents" 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                autoFocus
              />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setFolderModalOpen(false)}>Cancel</button>
                <button onClick={handleCreateFolder} className="btn-primary" disabled={!newFolderName}>Create</button>
              </div>
            </div>
          </div>
        )}

        {isImageModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Upload Image</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <input 
                  type="text" 
                  placeholder="Image Name (Optional)" 
                  value={uploadName} 
                  onChange={e => setUploadName(e.target.value)} 
                />
                <div style={{border: '2px dashed var(--border-color)', padding: '32px', textAlign: 'center', borderRadius: 'var(--radius-md)', background: 'var(--hover-color)'}}>
                  <Upload size={32} color="var(--primary-color)" style={{marginBottom: '12px'}} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setUploadFile(e.target.files[0])} 
                    style={{ display: 'block', margin: '0 auto' }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setImageModalOpen(false)}>Cancel</button>
                <button onClick={handleUploadImage} className="btn-primary" disabled={!uploadFile}>Upload Now</button>
              </div>
            </div>
          </div>
        )}

        {editItem && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Rename {editItem.type === 'folder' ? 'Folder' : 'File'}</h3>
              <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                autoFocus
              />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setEditItem(null)}>Cancel</button>
                <button onClick={handleRename} className="btn-primary" disabled={!editName}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {deleteItem && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{color: 'var(--danger-color)'}}>Delete {deleteItem.type === 'folder' ? 'Folder' : 'File'}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                Are you sure you want to delete <strong>"{deleteItem.name}"</strong>? 
                {deleteItem.type === 'folder' && ' This will permanently delete all contents inside. This action cannot be undone.'}
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteItem(null)}>Keep Item</button>
                <button onClick={handleDelete} className="btn-danger">Yes, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
