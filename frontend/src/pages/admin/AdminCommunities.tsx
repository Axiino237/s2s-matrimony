import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe,
  Plus,
  Pencil,
  Users2,
  X,
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
  const [addType, setAddType] = useState<'MAIN' | 'SUB'>('MAIN');
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

  // Map of parentId -> array of child sub-communities
  const subCommunitiesMap = useMemo(() => {
    const map = new Map<string, CommunityData[]>();
    communities.forEach((item) => {
      if (item.parentId) {
        const list = map.get(item.parentId) || [];
        if (!list.some((existing) => existing.id === item.id)) {
          list.push(item);
        }
        map.set(item.parentId, list);
      }
    });

    communities.forEach((item) => {
      if (item.children && Array.isArray(item.children)) {
        const list = map.get(item.id) || [];
        item.children.forEach((child) => {
          if (!list.some((existing) => existing.id === child.id)) {
            list.push(child);
          }
        });
        map.set(item.id, list);
      }
    });

    return map;
  }, [communities]);

  const allParentCommunities = useMemo(() => {
    return communities.filter((c) => !c.parentId);
  }, [communities]);

  const mainCommunities = useMemo(() => {
    const parents = allParentCommunities;
    const listToFilter = parents.length > 0 ? parents : communities;
    if (!search.trim()) return listToFilter;

    const term = search.toLowerCase();
    return listToFilter.filter((c) => {
      const subs = subCommunitiesMap.get(c.id) || [];
      return (
        c.name.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        subs.some((sub) => sub.name.toLowerCase().includes(term))
      );
    });
  }, [allParentCommunities, communities, search, subCommunitiesMap]);

  const totalSubCommunitiesCount = useMemo(() => {
    let count = 0;
    subCommunitiesMap.forEach((subs) => {
      count += subs.length;
    });
    return count;
  }, [subCommunitiesMap]);

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddMainCommunity = () => {
    setAddType('MAIN');
    setNewParentId(null);
    setNewName('');
    setNewDesc('');
    setShowAdd(true);
  };

  const openAddSubCommunity = (parentId: string) => {
    setAddType('SUB');
    setNewParentId(parentId);
    setNewName('');
    setNewDesc('');
    setShowAdd(true);
    setExpandedParents((prev) => ({ ...prev, [parentId]: true }));
  };

  const handleAddCommunity = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Please enter a name');
      return;
    }

    if (addType === 'SUB' && !newParentId) {
      toast.error('Please select a main parent community');
      return;
    }

    const parentIdToUse = addType === 'SUB' ? newParentId : null;

    try {
      const created = await communitiesApi.createCommunity({
        name: trimmed,
        description: newDesc.trim() || undefined,
        parentId: parentIdToUse,
      });

      toast.success(
        parentIdToUse
          ? `Sub-community "${created.name}" added successfully!`
          : `Community "${created.name}" created successfully!`
      );

      if (parentIdToUse) {
        setExpandedParents((prev) => ({ ...prev, [parentIdToUse]: true }));
      }

      setShowAdd(false);
      setNewName('');
      setNewDesc('');
      setNewParentId(null);
      await fetchCommunities();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create community';
      toast.error(msg);
      console.error(error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const trimmed = editItem.name.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const updated = await communitiesApi.updateCommunity(editItem.id, {
        name: trimmed,
        description: editItem.description?.trim() || undefined,
        isActive: editItem.isActive,
        parentId: editItem.parentId,
      });

      toast.success(`"${updated.name}" updated successfully!`);
      setEditItem(null);
      await fetchCommunities();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update community';
      toast.error(msg);
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

      toast.success(`"${item.name}" ${!item.isActive ? 'activated' : 'deactivated'}`);
      await fetchCommunities();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleDelete = async (id: string, name: string, isSub: boolean = false) => {
    const confirmMessage = isSub
      ? `Are you sure you want to delete sub-community "${name}"?`
      : `Are you sure you want to delete community "${name}" and all of its sub-communities?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await communitiesApi.deleteCommunity(id);
      setCommunities((prev) =>
        prev
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            children: c.children?.filter((sub) => sub.id !== id) || [],
          }))
      );
      toast.success(`"${name}" deleted successfully!`);
      await fetchCommunities();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to delete community';
      toast.error(msg);
      console.error(error);
    }
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
            <span className="font-bold text-rose-600">{totalSubCommunitiesCount}</span> Sub-Communities / Sub-Castes in DB
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
            onClick={openAddMainCommunity}
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
            const children = subCommunitiesMap.get(c.id) || [];
            const isExpanded = expandedParents[c.id] ?? false;

            return (
              <div
                key={c.id}
                className="card p-4 sm:p-5 hover:border-primary/45 transition-all flex flex-col gap-3.5 bg-white border border-slate-200 shadow-sm hover:shadow-md"
              >
                {/* Community Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0 mt-0.5">
                      {c.name[0] || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-text-primary font-bold text-sm sm:text-base leading-snug">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        <span className="text-text-muted text-xs flex items-center gap-1 whitespace-nowrap">
                          <Users2 className="w-3.5 h-3.5" /> {c.memberCount || 0} members
                        </span>
                        <span
                          className={`badge text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 whitespace-nowrap ${
                            children.length > 0
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <Layers className="w-3 h-3 text-rose-500" /> {children.length} sub-communities
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Community Active Toggle */}
                  <button
                    onClick={() => toggleStatus(c)}
                    className={`w-11 h-6 rounded-full relative transition-all duration-200 shadow-inner flex-shrink-0 mt-0.5 ${
                      c.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={c.isActive ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                        c.isActive ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Description */}
                {c.description ? (
                  <p className="text-text-secondary text-xs line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {c.description}
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs italic bg-slate-50/50 p-2 rounded-xl border border-dashed border-slate-100">
                    No description added
                  </p>
                )}

                {/* Sub-communities expandable view (ALWAYS visible for all communities) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors py-1.5 px-1.5 rounded-lg hover:bg-primary/5 flex-1 text-left"
                    >
                      <Layers className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>Sub-Communities ({children.length})</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                    <button
                      onClick={() => openAddSubCommunity(c.id)}
                      className="text-xs font-semibold text-primary hover:text-primary-dark hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 border border-primary/20"
                      title={`Add a new sub-community under ${c.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Add Sub</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto pr-1 animate-fade-in">
                      {children.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                          <p className="text-xs text-text-muted">No sub-communities added yet.</p>
                          <button
                            onClick={() => openAddSubCommunity(c.id)}
                            className="btn btn-secondary btn-xs text-xs text-primary border-primary/30 hover:bg-primary/5 mx-auto flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add First Sub-Community
                          </button>
                        </div>
                      ) : (
                        <>
                          {children.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2 text-xs py-2 px-3 bg-slate-50/90 rounded-xl border border-slate-200/70 hover:bg-slate-100 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-text-primary font-medium truncate block">
                                  {sub.name}
                                </span>
                                {sub.description && (
                                  <span className="text-[11px] text-text-muted truncate block">
                                    {sub.description}
                                  </span>
                                )}
                              </div>
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
                                  onClick={() => handleDelete(sub.id, sub.name, true)}
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
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-auto flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditItem({ ...c })}
                      className="btn btn-secondary btn-sm text-xs py-1.5 px-3 flex items-center gap-1 border-slate-200 bg-white hover:bg-slate-50"
                    >
                      <Pencil className="w-3.5 h-3.5 text-primary" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name, false)}
                      className="btn btn-ghost btn-sm text-xs py-1.5 px-2.5 text-rose-600 hover:bg-rose-50 border border-rose-100"
                      title="Delete community"
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

      {/* Add Modal (Supports Main Community & Sub-Community) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-text-primary font-display text-lg font-bold">
                  {addType === 'SUB' ? 'Add Sub-Community' : 'Add Main Community'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {addType === 'SUB'
                    ? 'Create a sub-community or sub-caste under a parent community'
                    : 'Create a new primary community portal'}
                </p>
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

            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAddType('MAIN');
                  setNewParentId(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  addType === 'MAIN'
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Main Community
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddType('SUB');
                  if (!newParentId && allParentCommunities.length > 0) {
                    setNewParentId(allParentCommunities[0].id);
                  }
                }}
                className={`py-2 rounded-lg transition-all ${
                  addType === 'SUB'
                    ? 'bg-white text-primary shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sub-Community
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Parent Community Select (When Sub-Community) */}
              {addType === 'SUB' && (
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                    Parent Community *
                  </label>
                  <select
                    className="input border-slate-200 text-text-primary w-full text-xs font-medium"
                    value={newParentId || ''}
                    onChange={(e) => setNewParentId(e.target.value || null)}
                  >
                    <option value="" disabled>
                      Select parent community...
                    </option>
                    {allParentCommunities.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  {addType === 'SUB' ? 'Sub-Community Name *' : 'Community Name *'}
                </label>
                <input
                  className="input border-slate-200 text-text-primary w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={
                    addType === 'SUB'
                      ? 'e.g. Kongu Vellalar or General'
                      : 'e.g. Nadar Matrimony'
                  }
                  autoFocus
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
                  placeholder="Enter brief details or background..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
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
              {/* If sub-community, allow changing parent */}
              {editItem.parentId && (
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                    Parent Community
                  </label>
                  <select
                    className="input border-slate-200 text-text-primary w-full text-xs"
                    value={editItem.parentId}
                    onChange={(e) =>
                      setEditItem((prev) =>
                        prev ? { ...prev, parentId: e.target.value } : null
                      )
                    }
                  >
                    {allParentCommunities.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Name
                </label>
                <input
                  className="input border-slate-200 text-text-primary w-full"
                  value={editItem.name}
                  onChange={(e) =>
                    setEditItem((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  className="input border-slate-200 text-text-primary w-full h-20 py-2 resize-none"
                  value={editItem.description || ''}
                  onChange={(e) =>
                    setEditItem((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-text-primary block">Active Status</span>
                  <span className="text-[11px] text-text-muted">
                    {editItem.isActive
                      ? 'Visible to users on registration and search'
                      : 'Hidden from members'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditItem((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null))
                  }
                  className={`w-11 h-6 rounded-full relative transition-all duration-200 shadow-inner flex-shrink-0 ${
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

            <div className="flex gap-2 pt-2 border-t border-slate-100">
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommunities;
