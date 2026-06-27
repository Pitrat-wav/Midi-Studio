import React, { useEffect, useState, useCallback } from 'react'
import { getApiUrl } from '../../logic/apiConfig'
import { ProjectManager } from '../../logic/ProjectManager'
import { useVisualStore } from '../../store/visualStore'
import { Save, User, Download, Heart, RefreshCw, X } from 'lucide-react'
import './SocialHub.css'

interface ProjectSummary {
    id: number
    name: string
    author: string
    parent_id: number | null
    likes: number
    created_at: string
}

export function SocialHub() {
    const [activeTab, setActiveTab] = useState<'feed' | 'share'>('feed')
    const [projects, setProjects] = useState<ProjectSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<string | null>(null)
    const [projectName, setProjectName] = useState('')
    const [projectAuthor, setProjectAuthor] = useState('Anonymous')
    const [loadedProjectId, setLoadedProjectId] = useState<number | null>(null)
    
    const cycleView = useVisualStore(s => s.cycleView)
    const API_URL = getApiUrl((import.meta as any).env)

    const fetchProjects = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/projects`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setProjects(data)
        } catch (e) {
            console.error(e)
            setStatus('Error fetching projects')
        } finally {
            setLoading(false)
        }
    }, [API_URL])

    useEffect(() => {
        if (activeTab === 'feed') fetchProjects()
    }, [activeTab, fetchProjects])

    const handleSave = async () => {
        if (!projectName) {
            setStatus('Project name required')
            return
        }
        
        (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
        setLoading(true)
        try {
            const state = ProjectManager.getProjectState()
            const payload = {
                name: projectName,
                author: projectAuthor,
                data: state,
                parent_id: loadedProjectId
            }
            
            const res = await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            
            if (!res.ok) throw new Error('Failed to save')
            
            (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
            setStatus('Project shared successfully!')
            setProjectName('')
            setActiveTab('feed')
        } catch (e) {
            setStatus('Error saving project')
        } finally {
            setLoading(false)
        }
    }

    const handleLoad = async (id: number) => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/projects/${id}`)
            if (!res.ok) throw new Error('Failed to load')
            const project = await res.json()
            
            const state = JSON.parse(project.data)
            ProjectManager.loadProjectState(state)
            
            setLoadedProjectId(id)
            setStatus(`Loaded: ${project.name}`)
            // Maybe close the hub? Or just stay.
        } catch (e) {
            setStatus('Error loading project')
        } finally {
            setLoading(false)
        }
    }

    const handleLike = async (id: number) => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
        try {
            await fetch(`${API_URL}/api/projects/${id}/like`, { method: 'POST' })
            fetchProjects() // refresh
        } catch (e) {
            console.error(e)
        }
    }

    const handleClose = () => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
        cycleView()
    }

    const switchTab = (tab: 'feed' | 'share') => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged()
        setActiveTab(tab)
    }

    return (
        <div className="social-hub-overlay">
            <div className="social-window">
                <div className="social-header">
                    <h2>COMMUNITY HUB</h2>
                    <button
                        onClick={handleClose}
                        className="close-btn"
                        aria-label="Close Community Hub"
                    >
                        <X />
                    </button>
                </div>
                
                <div className="social-tabs">
                    <button 
                        className={activeTab === 'feed' ? 'active' : ''} 
                        onClick={() => switchTab('feed')}
                        aria-pressed={activeTab === 'feed'}
                    >
                        DISCOVER
                    </button>
                    <button 
                        className={activeTab === 'share' ? 'active' : ''} 
                        onClick={() => switchTab('share')}
                        aria-pressed={activeTab === 'share'}
                    >
                        SHARE
                    </button>
                </div>

                <div className="social-content">
                    {loading && <div className="loading-spinner"><RefreshCw className="spin" /></div>}
                    {status && <div className="status-msg">{status}</div>}

                    {activeTab === 'feed' && (
                        <div className="project-list">
                            {projects.map(p => (
                                <div key={p.id} className="project-card">
                                    <div className="p-info">
                                        <h3>{p.name}</h3>
                                        <span className="p-author"><User size={12}/> {p.author}</span>
                                        {p.parent_id && <span className="p-remix">Remix</span>}
                                    </div>
                                    <div className="p-actions">
                                        <button
                                            className="like-btn"
                                            onClick={() => handleLike(p.id)}
                                            aria-label={`Like project ${p.name}`}
                                        >
                                            <Heart size={14} fill={p.likes > 0 ? "currentColor" : "none"} /> {p.likes}
                                        </button>
                                        <button
                                            className="load-btn"
                                            onClick={() => handleLoad(p.id)}
                                            aria-label={`Load project ${p.name}`}
                                        >
                                            <Download size={14} /> LOAD
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'share' && (
                        <div className="share-form">
                            <label htmlFor="project-name">Project Name</label>
                            <input 
                                id="project-name"
                                type="text" 
                                value={projectName} 
                                onChange={e => setProjectName(e.target.value)}
                                placeholder="My Awesome Jam"
                            />
                            
                            <label htmlFor="project-author">Author</label>
                            <input 
                                id="project-author"
                                type="text" 
                                value={projectAuthor} 
                                onChange={e => setProjectAuthor(e.target.value)}
                                placeholder="Anonymous"
                            />

                            <button className="save-submit-btn" onClick={handleSave} disabled={loading}>
                                <Save size={16} /> PUBLISH TO COMMUNITY
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
