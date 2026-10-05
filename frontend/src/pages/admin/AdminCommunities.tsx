import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe,
  Plus,
  Pencil,
  Users2,
  X,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { communitiesApi, CommunityData } from '../../services/communities.service';

const AdminCommunities = () => {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<CommunityData | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await communitiesApi.getCommunities(search, true);
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

  const mainCommunities = useMemo(() => {
    const parents = communities.filter((c) => !c.parentId);
    const listToFilter = parents.length > 0 ? parents : communities;
    if (!search.trim()) return listToFilter;

    const term = search.toLowerCase();
    return listToFilter.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.children?.some((sub) => sub.name.toLowerCase().includes(term))
    );
  }, [communities, search]);

  const totalSubCommunitiesCount = useMemo(
    () => communities.filter((c) => !!c.parentId).length,
    [communities]
  );

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
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
        parentId: newParentId,
      });
      setCommunities((prev) => [...prev, created]);
      toast.success(
        newParentId
          ? `Sub-community "${newName}" added successfully!`
          : `Community "${newName}" created successfully!`
      );
      setShowAdd(false);
      setNewName('');
      setNewDesc('');
      setNewParentId(null);
      fetchCommunities();
    } catch (error) {
      toast.error('Failed to create community');
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
      setCommunities((prev) =>
        prev.map((c) => {
          if (c.id === editItem.id) return { ...c, ...updated };
          if (c.children?.some((sub) => sub.id === editItem.id)) {
            return {
              ...c,
              children: c.children.map((sub) =>
                sub.id === editItem.id ? { ...sub, ...updated } : sub
              ),
            };
          }
          return c;
        })
      );
      toast.success(`"${editItem.name}" updated!`);
      setEditItem(null);
      fetchCommunities();
    } catch (error) {
      toast.error('Failed to update community');
      console.error(error);
    }
  };

  const toggleStatus = async (item: CommunityData) => {
    try {
      const updated = await communitiesApi.updateCommunity(item.id, {
        isActive: !item.isActive,
      });
      setCommunities((prev) =>
        prev.map((c) => {
          if (c.id === item.id) return { ...c, ...updated };
          if (c.children?.some((sub) => sub.id === item.id)) {
            return {
              ...c,
              children: c.children.map((sub) =>
                sub.id === item.id ? { ...sub, ...updated } : sub
              ),
            };
          }
          return c;
        })
      );
      toast.success(`"${item.name}" ${!item.isActive ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await communitiesApi.deleteCommunity(id);
      setCommunities((prev) => prev.filter((c) => c.id !== id));
      toast.success('Community deleted');
      fetchCommunities();
    } catch (error) {
      toast.error('Failed to delete community');
      console.error(error);
    }
  };

  const openAddSubCommunity = (parentId: string) => {
    setNewParentId(parentId);
    setNewName('');
    setNewDesc('');
    setShowAdd(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 card bg-white border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" /> Communities & Sub-Communities
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-1">
            <span className="font-bold text-primary">{mainCommunities.length}</span> Main Communities •{' '}
            <span className="font-bold text-rose-600">{totalSubCommunitiesCount}</span> Sub-Communities / Sub-Castes seeded in DB
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input bg-slate-50 border-slate-200 text-text-primary text-xs pl-9 py-2 w-full sm:w-60 focus:bg-white"
            />
          </div>
          <button
            onClick={() => {
              setNewParentId(null);
              setShowAdd(true);
            }}
            className="btn btn-primary btn-sm flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Add Community
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white card border border-slate-200">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : mainCommunities.length === 0 ? (
        <div className="card p-12 text-center text-text-muted bg-white border border-slate-200">
          No communities found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {mainCommunities.map((c) => {
            const children = c.children || communities.filter((sub) => sub.parentId === c.id);
            const isExpanded = expandedParents[c.id] ?? false;

            return (
              <div
                key={c.id}
                className="card p-4 sm:p-5 hover:border-primary/45 transition-all flex flex-col gap-3.5 bg-white border border-slate-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0 mt-0.5">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-text-primary font-bold text-sm sm:text-base leading-snug">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        <span className="text-text-muted text-xs flex items-center gap-1 whitespace-nowrap">
                          <Users2 className="w-3.5 h-3.5" /> {c.memberCount || 0} members
                        </span>
                        {children.length > 0 && (
                          <span className="badge bg-rose-50 text-rose-600 border-rose-100 text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 whitespace-nowrap">
                            <Layers className="w-3 h-3 text-rose-500" /> {children.length} sub-communities
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStatus(c)}
                    className={`w-11 h-6 rounded-full relative transition-all duration-200 shadow-inner flex-shrink-0 mt-0.5 ${
                      c.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={c.isActive ? 'Active' : 'Inactive'}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                        c.isActive ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {c.description && (
                  <p className="text-text-secondary text-xs line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {c.description}
                  </p>
                )}

                {/* Sub-communities expandable view */}
                {children.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="flex items-center justify-between w-full text-xs font-bold text-primary hover:text-primary-dark transition-colors py-1.5 px-1 rounded-lg hover:bg-primary/5"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" /> Sub-Communities ({children.length})
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {children.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between gap-2 text-xs py-2 px-3 bg-slate-50/90 rounded-xl border border-slate-200/70 hover:bg-slate-100 transition-colors"
                          >
                            <span className="text-text-primary font-medium truncate flex-1">
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => toggleStatus(sub)}
                                className={`badge text-[10px] py-0.5 px-2 font-bold cursor-pointer transition-colors ${
                                  sub.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                                title="Click to toggle status"
                              >
                                {sub.isActive ? 'Active' : 'Off'}
                              </button>
                              <button
                                onClick={() => setEditItem({ ...sub })}
                                className="p-1 text-slate-500 hover:text-primary hover:bg-white rounded-md transition-colors"
                                title="Edit sub-community"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(sub.id, sub.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                                title="Delete sub-community"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => openAddSubCommunity(c.id)}
                          className="w-full mt-2 py-1.5 px-3 border border-dashed border-primary/40 rounded-xl text-primary text-xs font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Sub-Community
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-auto flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditItem({ ...c })}
                      className="btn btn-secondary btn-sm text-xs py-1.5 px-3 flex items-center gap-1 border-slate-200 bg-white hover:bg-slate-50"
                    >
                      <Pencil className="w-3.5 h-3.5 text-primary" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="btn btn-ghost btn-sm text-xs py-1.5 px-2.5 text-rose-600 hover:bg-rose-50 border border-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span
                    className={`badge text-xs py-1 px-2.5 font-bold ${
                      c.isActive ? 'badge-active' : 'badge-rejected'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-text-primary font-display text-lg font-bold">
                  {newParentId ? 'New Sub-Community' : 'New Community'}
                </h2>
                {newParentId && (
                  <p className="text-xs text-text-muted mt-0.5">
                    Parent:{' '}
                    <strong>
                      {communities.find((c) => c.id === newParentId)?.name || 'Main Community'}
                    </strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewParentId(null);
                }}
                className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Community Name
                </label>
                <input
                  className="input border-slate-200 text-text-primary w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={newParentId ? 'e.g. Paraiyar (Adidravidar)' : 'e.g. Nadar Matrimony'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  className="input border-slate-200 text-text-primary w-full h-20 py-2 resize-none"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Enter brief community details..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewParentId(null);
                }}
                className="btn btn-ghost btn-sm flex-1 border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCommunity}
                className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" /> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-text-primary font-display text-lg font-bold">
                  {editItem.parentId ? 'Edit Sub-Community' : 'Edit Community'}
                </h2>
                {editItem.parentId && (
                  <p className="text-xs text-text-muted mt-0.5">
                    Parent:{' '}
                    <strong>
                      {communities.find((c) => c.id === editItem.parentId)?.name ||
                        editItem.parent?.name ||
                        'Main Community'}
                    </strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Community Name
                </label>
                <input
                  className="input border-slate-200 text-text-primary w-full"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  className="input border-slate-200 text-text-primary w-full h-20 py-2 resize-none"
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-text-primary text-sm font-medium">Active Status</label>
                <button
                  onClick={() => setEditItem({ ...editItem, isActive: !editItem.isActive })}
                  className={`w-11 h-6 rounded-full relative transition-all duration-200 ${
                    editItem.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                      editItem.isActive ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditItem(null)}
                className="btn btn-ghost btn-sm flex-1 border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommunities;
