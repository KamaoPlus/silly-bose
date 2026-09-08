import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Plus,
  Search,
  ExternalLink,
  Download,
  Trash2,
  FileText,
  FileCode,
  Music,
  Video,
  Image,
  Layers,
  Sparkles,
  Lock,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';

const FORMAT_ICONS = {
  PSD: Image,
  PNG: Image,
  SVG: Image,
  ABR: Image,
  ZIP: Layers,
  CUBE: Video,
  MOGRT: Video,
  PRFPS: Video,
  MP3: Music,
  WAV: Music,
  DOCX: FileText,
  PDF: FileCode,
};

export default function UsefulResources() {
  const { state, actions, currentUser } = useApp();

  const userRole = currentUser?.role?.toLowerCase() || 'admin';
  const canManage = userRole === 'admin' || userRole === 'strategist';

  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewResourceModalOpen, setIsNewResourceModalOpen] = useState(false);

  // New folder form
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderColor, setFolderColor] = useState('#4f46e5');

  // New resource item form
  const [itemFolderId, setItemFolderId] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemFormat, setItemFormat] = useState('ZIP');
  const [itemSize, setItemSize] = useState('');
  const [itemLink, setItemLink] = useState('');

  const folders = state.resources || [];

  // Filter items
  const filteredFolders = folders.map((folder) => {
    if (selectedFolderId !== 'all' && folder.id !== selectedFolderId) {
      return { ...folder, items: [] };
    }
    const filteredItems = (folder.items || []).filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.format.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
    return { ...folder, items: filteredItems };
  }).filter((f) => selectedFolderId === 'all' || f.id === selectedFolderId);

  const totalItemsCount = folders.reduce((acc, f) => acc + (f.items?.length || 0), 0);

  const handleCreateFolder = (e) => {
    e?.preventDefault();
    if (!folderName.trim()) return;

    const newFolder = {
      id: 'folder-' + Date.now().toString(36),
      name: folderName.trim(),
      description: folderDesc.trim() || 'Shared studio assets & guidelines',
      color: folderColor,
      items: [],
    };

    actions.addResourceFolder(newFolder);
    setFolderName('');
    setFolderDesc('');
    setIsNewFolderModalOpen(false);
  };

  const handleCreateResource = (e) => {
    e?.preventDefault();
    if (!itemTitle.trim() || !itemFolderId) return;

    const newItem = {
      id: 'res-' + Date.now().toString(36),
      title: itemTitle.trim(),
      format: itemFormat.toUpperCase(),
      size: itemSize.trim() || '1.0 MB',
      link: itemLink.trim() || 'https://drive.google.com',
      addedAt: new Date().toISOString().split('T')[0],
    };

    actions.addResourceItem(itemFolderId, newItem);
    setItemTitle('');
    setItemSize('');
    setItemLink('');
    setIsNewResourceModalOpen(false);
  };

  const handleDeleteFolder = (folder) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}" and all its assets?`)) {
      actions.deleteResourceFolder(folder.id);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId('all');
      }
    }
  };

  const handleDeleteItem = (folderId, item) => {
    if (window.confirm(`Delete resource "${item.title}"?`)) {
      actions.deleteResourceItem(folderId, item.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
              Shared Studio Repository
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Useful Resources & Templates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Brand assets, 4K LUTs, audio libraries, thumbnail templates, and guidelines.
          </p>
        </div>

        {/* Action buttons (Restricted to Admin & Strategist) */}
        <div className="flex items-center gap-2.5">
          {canManage ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={FolderPlus}
                onClick={() => setIsNewFolderModalOpen(true)}
              >
                + New Folder
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setItemFolderId(folders[0]?.id || '');
                  setIsNewResourceModalOpen(true);
                }}
              >
                + Add Resource
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              <Lock size={12} className="text-slate-500" />
              <span>Studio Shared (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Resource Folders ({folders.length})</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.items?.length || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, formats, templates..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Shared Assets: <strong className="text-slate-900">{totalItemsCount} files</strong>
        </div>
      </div>

      {/* Folders and Resource Grid */}
      <div className="space-y-6">
        {filteredFolders.map((folder) => {
          if (selectedFolderId !== 'all' && folder.id !== selectedFolderId) return null;

          return (
            <div
              key={folder.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden"
            >
              {/* Folder Header */}
              <div
                className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                style={{ borderLeft: `5px solid ${folder.color || '#4f46e5'}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: folder.color || '#4f46e5' }}
                  >
                    <Folder size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{folder.name}</h3>
                    <p className="text-xs text-slate-500">{folder.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {folder.items?.length || 0} Assets
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteFolder(folder)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete this entire folder"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 sm:p-6">
                {folder.items && folder.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folder.items.map((item) => {
                      const IconComponent = FORMAT_ICONS[item.format] || Layers;

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:bg-white rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                                style={{ backgroundColor: folder.color || '#4f46e5' }}
                              >
                                <IconComponent size={15} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                                    {item.format}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {item.size}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {canManage && (
                              <button
                                onClick={() => handleDeleteItem(folder.id, item)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-opacity"
                                title="Delete asset"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {/* Action Links */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400">Added: {item.addedAt}</span>

                            <div className="flex items-center gap-1.5">
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
                              >
                                <span>Open</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type="button"
                                onClick={() => alert(`Simulating download for: ${item.title}`)}
                                className="p-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 transition-colors shadow-xs"
                                title="Download Asset"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No resources found in this folder.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Folder (Admin & Strategist) */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title="Create New Resource Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            label="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g. YouTube End Screen Cards"
            required
          />
          <Input
            label="Folder Description"
            value={folderDesc}
            onChange={(e) => setFolderDesc(e.target.value)}
            placeholder="Briefly describe what assets are stored in this folder..."
          />
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Folder Accent Color
            </label>
            <div className="flex items-center gap-2">
              {['#4f46e5', '#0284c7', '#059669', '#ea580c', '#ec4899', '#9333ea'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setFolderColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform ${folderColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsNewFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Resource Item (Admin & Strategist) */}
      <Modal
        isOpen={isNewResourceModalOpen}
        onClose={() => setIsNewResourceModalOpen(false)}
        title="Upload / Add Studio Asset"
      >
        <form onSubmit={handleCreateResource} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Target Folder
            </label>
            <select
              value={itemFolderId}
              onChange={(e) => setItemFolderId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Resource Title"
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            placeholder="e.g. Master Lower Thirds MOGRT (4K)"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Format (e.g. PSD, ZIP, CUBE, MP3)"
              value={itemFormat}
              onChange={(e) => setItemFormat(e.target.value)}
              placeholder="PSD, ZIP, MP3..."
              required
            />
            <Input
              label="File Size"
              value={itemSize}
              onChange={(e) => setItemSize(e.target.value)}
              placeholder="e.g. 24.5 MB"
            />
          </div>

          <Input
            label="Google Drive / Asset Link"
            type="url"
            value={itemLink}
            onChange={(e) => setItemLink(e.target.value)}
            placeholder="https://drive.google.com/..."
            required
          />

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsNewResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
