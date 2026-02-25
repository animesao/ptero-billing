import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function AdminNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const nodesData = await api.admin.getNodes();
      setNodes(nodesData);
      if (nodesData.length > 0 && !selectedNode) {
        setSelectedNode(nodesData[0].id);
        loadNodeDetails(nodesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNodeDetails = async (nodeId) => {
    try {
      const allocations = await api.admin.getNodeAllocations(nodeId);
      setNodeDetails({ allocations });
    } catch (error) {
      console.error('Failed to load node details:', error);
    }
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId);
    loadNodeDetails(nodeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Настройка нод</h1>
        <button
          onClick={loadNodes}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
        </div>
      ) : nodes.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#dc143c]/20 to-[#ff1493]/20 border border-[#dc143c]/30 flex items-center justify-center animate-float">
            <svg className="w-10 h-10 text-[#dc143c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Ноды не найдены</h3>
          <p className="text-[#666]">Настройте подключение к Pterodactyl в разделе Настройки</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список нод */}
          <div className="lg:col-span-1 space-y-3">
            {nodes.map((node) => {
              const nodeName = node.attributes?.name || node.name;
              const nodeLocation = node.attributes?.location || node.location;
              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeSelect(node.id)}
                  className={`glass-card p-4 cursor-pointer transition-all duration-300 hover:border-[#dc143c]/30 ${
                    selectedNode === node.id
                      ? 'border-[#dc143c]/50 bg-[#dc143c]/10'
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        node.attributes?.is_under_maintenance
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="text-white font-medium">{nodeName}</p>
                        <p className="text-xs text-[#666]">{nodeLocation || '—'}</p>
                      </div>
                    </div>
                    {selectedNode === node.id && (
                      <svg className="w-5 h-5 text-[#dc143c]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Детали ноды */}
          {selectedNode && nodeDetails && (
            <div className="lg:col-span-2 space-y-6 animate-slide-up">
              {/* Инфо о ноде */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Информация о ноде
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-[#666] mb-1">Название</p>
                    <p className="text-white font-medium">
                      {nodes.find(n => n.id === selectedNode)?.attributes?.name || '—'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-[#666] mb-1">Локация</p>
                    <p className="text-white font-medium">
                      {nodes.find(n => n.id === selectedNode)?.attributes?.location || '—'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-[#666] mb-1">Статус</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        nodes.find(n => n.id === selectedNode)?.attributes?.is_under_maintenance
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}></span>
                      {nodes.find(n => n.id === selectedNode)?.attributes?.is_under_maintenance
                        ? 'Обслуживание'
                        : 'Работает'
                      }
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-[#666] mb-1">ID</p>
                    <p className="text-white font-medium">{selectedNode}</p>
                  </div>
                </div>
              </div>

              {/* Аллокации */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Аллокации (порты)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {nodeDetails.allocations.length === 0 ? (
                    <p className="text-[#666] text-center py-8">Нет аллокаций</p>
                  ) : (
                    nodeDetails.allocations.map((alloc) => {
                      const ip = alloc.attributes?.ip_address;
                      const port = alloc.attributes?.port;
                      const assigned = alloc.attributes?.assigned;
                      const alias = alloc.attributes?.ip_alias;
                      return (
                        <div
                          key={alloc.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            assigned
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-green-500/10 border-green-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              assigned ? 'bg-red-500' : 'bg-green-500'
                            }`}></div>
                            <div>
                              <p className="text-white font-mono text-sm">
                                {alias || ip}:{port}
                              </p>
                              <p className="text-xs text-[#666]">
                                {assigned ? 'Занят' : 'Свободен'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[#666]">Свободен</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-[#666]">Занят</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
