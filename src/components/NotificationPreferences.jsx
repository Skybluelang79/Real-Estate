import { useState } from 'react'
import { useTheme } from '../context/ThemeCtx'

export default function NotificationPreferences() {
  const { darkMode } = useTheme()
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    propertyAlerts: true,
    priceDropAlerts: true,
    newListingAlerts: true,
    messageAlerts: true,
    marketingEmails: false,
  })

  const toggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sections = [
    {
      title: 'Email Notifications',
      items: [
        { key: 'emailNotifications', label: 'Enable email notifications' },
        { key: 'marketingEmails', label: 'Marketing and promotional emails' },
      ]
    },
    {
      title: 'Property Alerts',
      items: [
        { key: 'propertyAlerts', label: 'General property alerts' },
        { key: 'priceDropAlerts', label: 'Price drop notifications' },
        { key: 'newListingAlerts', label: 'New listing notifications' },
      ]
    },
    {
      title: 'Messaging',
      items: [
        { key: 'messageAlerts', label: 'New message notifications' },
        { key: 'pushNotifications', label: 'Push notifications' },
      ]
    }
  ]

  return (
    <div className={`notification-prefs ${darkMode ? 'dark' : ''}`}>
      <h2>Notification Preferences</h2>
      {sections.map(section => (
        <div key={section.title} className="pref-section">
          <h3>{section.title}</h3>
          {section.items.map(item => (
            <label key={item.key} className="pref-item">
              <span>{item.label}</span>
              <button
                role="switch"
                aria-checked={prefs[item.key]}
                onClick={() => toggle(item.key)}
                className={`toggle-switch ${prefs[item.key] ? 'active' : ''}`}
              >
                <span className="toggle-knob" />
              </button>
            </label>
          ))}
        </div>
      ))}
      <button className="btn-primary" onClick={() => alert('Preferences saved!')}>
        Save Preferences
      </button>
    </div>
  )
}
