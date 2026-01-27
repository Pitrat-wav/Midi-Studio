import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallbackName?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    private handleDeepReset = () => {
        if (confirm('Это полностью сбросит состояние приложения и перезагрузит страницу. Продолжить?')) {
            sessionStorage.clear()
            window.location.reload()
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '24px',
                    margin: '16px',
                    background: 'var(--tg-theme-secondary-bg-color)',
                    border: '1px solid var(--tg-theme-destructive-text-color)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 32px rgba(255, 59, 48, 0.1)'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--tg-theme-destructive-text-color)'
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 8px', color: 'var(--tg-theme-text-color)' }}>
                            Упс! Ошибка в {this.props.fallbackName || 'компоненте'}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', lineHeight: '1.5' }}>
                            Что-то пошло не так при отрисовке интерфейса. <br />
                            Мы поймали ошибку, чтобы приложение не "вылетело".
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: 'var(--tg-theme-button-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={18} /> Перезагрузить
                        </button>
                        {this.props.fallbackName === 'Root App' && (
                            <button
                                onClick={this.handleDeepReset}
                                style={{
                                    padding: '12px 16px',
                                    background: 'rgba(255, 59, 48, 0.1)',
                                    color: 'var(--tg-theme-destructive-text-color)',
                                    border: '1px solid var(--tg-theme-destructive-text-color)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Полный сброс
                            </button>
                        )}
                    </div>
                    <pre style={{
                        fontSize: '10px',
                        textAlign: 'left',
                        width: '100%',
                        overflow: 'auto',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: '8px',
                        color: 'var(--tg-theme-destructive-text-color)'
                    }}>
                        {this.state.error?.toString()}
                    </pre>
                </div>
            )
        }

        return this.props.children
    }
}
