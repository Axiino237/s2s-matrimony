import { useState, useEffect, useMemo, useCallback } from 'react';
import { Globe, Plus, Pencil, Users2, X, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { communitiesApi, CommunityData } from '../../services/communities.service';

const AdminCommunities = () => {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<CommunityData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Fetch communities from backend
  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await communitiesApi.getCommunities(search);
      setCommunities(data);
    } catch (error) {
      toast.error('Failed to load communities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const filtered = useMemo(() =>
    communities.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [communities, search]
  );

  const toggleStatus = async (item: CommunityData) => {
    try {
      const updated = await communitiesApi.updateCommunity(item.id, {
        isActive: !item.isActive,
      });
      setCommunities(prev => prev.map(c => c.id === item.id ? updated : c));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      const updated = await communitiesApi.updateCommunity(editItem.id, {
        name: editItem.name,
        description: editItem.description,
        isActive: editItem.isActive,
      });
      setCommunities(prev => prev.map(c => c.id === editItem.id ? updated : c));
      toast.success(`"${editItem.name}" updated!`);
      setEditItem(null);
    } catch (error) {
      toast.error('Failed to update community');
      console.error(error);
    }
  };

  const handleAddCommunity = async () => {
    if (!newName.trim()) {
      toast.error('Enter community name');
      return;
    }
    try {
      const created = await communitiesApi.createCommunity({
        name: newName,
        description: newDesc,
      });
      setCommunities(prev => [...prev, created]);
      toast.success(`Community "${newName}" added!`);
      setShowAdd(false);
      setNewName('');
      setNewDesc('');
    } catch (error) {
      toast.error('Failed to add community');
      console.error(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await communitiesApi.deleteCommunity(id);
      setCommunities(prev => prev.filter(c => c.id !== id));
      toast.success('Community deleted');
    } catch (error) {
      toast.error('Failed to delete community');
      console.error(error);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Communities
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {communities.length} communities · {communities.filter(c => c.isActive).length} active
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Community
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input py-2 w-full max-w-sm"
        placeholder="🔍 Search communities..."
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-text-muted">
          No communities found.
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card p-4 hover:border-primary/30 transition-all flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-text-primary font-semibold">{c.name}</p>
                    <p className="text-text-muted text-xs flex items-center gap-1">
                      <Users2 className="w-3 h-3" /> {c.memberCount || 0} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(c)}
                  className={`w-10 h-5 rounded-full relative transition-all duration-200 ${c.isActive ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${c.isActive ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              {c.description && (
                <p className="text-text-secondary text-xs line-clamp-2 mt-1">{c.description}</p>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
                <button onClick={() => setEditItem({ ...c })} className="btn btn-ghost btn-sm text-xs flex-1 flex items-center justify-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} className="btn btn-ghost btn-sm text-xs text-error hover:bg-error/5 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className={`badge text-xs self-center ml-auto ${c.isActive ? 'badge-active' : 'badge-rejected'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">Edit Community</h2>
              <button onClick={() => setEditItem(null)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="input-label">Community Name</label>
                <input className="input" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input h-20 py-2 resize-none" value={editItem.description || ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-text-primary text-sm font-medium">Active</label>
                <button
                  onClick={() => setEditItem({ ...editItem, isActive: !editItem.isActive })}
                  className={`w-12 h-6 rounded-full relative transition-all duration-200 ${editItem.isActive ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${editItem.isActive ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditItem(null)} className="btn btn-ghost btn-sm flex-1">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">New Community</h2>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="input-label">Community Name</label>
                <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Chettinad" />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input h-20 py-2 resize-none" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Enter brief community details..." />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm flex-1">Cancel</button>
              <button onClick={handleAddCommunity} className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommunities;
