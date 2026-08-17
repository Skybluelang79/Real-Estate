import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthCtx'
import { useTheme } from '../context/ThemeCtx'
import API_URL from '../config'

export default function PropertyAnalytics() {
  const { token } = useAuth()
  const { darkMode } = useTheme()

  const { data: properties } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.json()
    },
    enabled: !!token,
  })

  const stats = useMemo(() => {
    if (!properties?.properties) return null
    const props = properties.properties
    return {
      total: props.length,
      active: props.filter(p => p.status === 'active').length,
      sold: props.filter(p => p.status === 'sold').length,
      pending: props.filter(p => p.status === 'pending').length,
      avgPrice: props.reduce((sum, p) => sum + (p.price || 0), 0) / (props.length || 1),
      byType: props.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1
        return acc
      }, {}),
    }
  }, [properties])

  if (!stats) return <div className="analytics-loading">Loading analytics...</div>

  return (
    <div className={`property-analytics ${darkMode ? 'dark' : ''}`}>
      <h2>Property Analytics</h2>
      <div className="analytics-grid">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Properties</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.active}</span>
          <span className="stat-label">Active Listings</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.sold}</span>
          <span className="stat-label">Sold</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">${Math.round(stats.avgPrice).toLocaleString()}</span>
          <span className="stat-label">Average Price</span>
        </div>
      </div>

      <h3>Properties by Type</h3>
      <div className="type-breakdown">
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="type-bar">
            <span className="type-label">{type}</span>
            <div className="type-bar-track">
              <div
                className="type-bar-fill"
                style={{ width: `${(count / stats.total) * 100}%` }}
              />
            </div>
            <span className="type-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
