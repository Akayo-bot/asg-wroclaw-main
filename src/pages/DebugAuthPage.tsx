import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, User, Shield, Globe, Database, RefreshCw, RotateCw, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hasAdminAccess, getRoleDisplayName, getRoleBadgeVariant } from '@/utils/auth';
import { RolePill } from '@/components/admin/RolePill';
import { useToast } from '@/hooks/use-toast';

const DebugAuthPage = () => {
    const {
        user,
        profile,
        session,
        loading,
        jwtRole,
        dbRole,
        rolesSynced,
        hasAdminAccess: hasAdminAccessValue,
        refreshRole,
        syncRoleToJWT,
        ensureSuperadmin
    } = useAuth();
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [promoting, setPromoting] = useState(false);

    const handleRefreshRole = async () => {
        setRefreshing(true);
        try {
            await refreshRole();
            toast({
                title: "Success",
                description: "Role refreshed from database"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setRefreshing(false);
        }
    };

    const handleSyncRole = async () => {
        setSyncing(true);
        try {
            const { error } = await syncRoleToJWT();
            if (error) throw error;

            toast({
                title: "Success",
                description: "Role synchronized to JWT token"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleEnsureSuperadmin = async () => {
        setPromoting(true);
        try {
            const { error } = await ensureSuperadmin();
            if (error) throw error;

            toast({
                title: "Success",
                description: "Emergency superadmin check completed"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setPromoting(false);
        }
    };

    // Calculate admin access reasons
    const getAdminAccessReason = () => {
        if (!user) return "No user session";
        if (!profile) return "No profile found";
        if (!profile.role) return "No role assigned";
        if (!hasAdminAccess(profile.role)) return `Role '${profile.role}' has no admin access`;
        return "Access granted via role";
    };

    const getProfileIdStatus = () => {
        if (!user || !profile) return { status: 'unknown', message: 'Missing data' };
        if (user.id === profile.id && user.id === profile.user_id) {
            return { status: 'synced', message: 'IDs are synchronized' };
        }
        return { status: 'error', message: 'ID mismatch detected' };
    };

    const getRoleSyncStatus = () => {
        if (!jwtRole && !dbRole) return { status: 'none', message: 'No roles found' };
        if (jwtRole === dbRole) return { status: 'synced', message: 'Roles are synchronized' };
        return { status: 'out-of-sync', message: `JWT: ${jwtRole || 'none'}, DB: ${dbRole || 'none'}` };
    };

    // Show only in development
    if (process.env.NODE_ENV === 'production') {
        return (
            <Layout hideDefaultCursor={false}>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Access Denied
                            </CardTitle>
                            <CardDescription>
                                Debug page is only available in development mode.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link to="/">Back to Home</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout hideDefaultCursor={false}>
            <div className="min-h-screen p-4 bg-background">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">🔍 Authentication Debug</h1>
                        <p className="text-muted-foreground">Development mode diagnostics</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* User Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    User Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <strong>Email:</strong>{' '}
                                    <Badge variant={user?.email ? 'default' : 'destructive'}>
                                        {user?.email || 'Not logged in'}
                                    </Badge>
                                </div>
                                <div>
                                    <strong>User ID:</strong>{' '}
                                    <code className="text-xs bg-muted p-1 rounded">
                                        {user?.id || 'null'}
                                    </code>
                                </div>
                                <div>
                                    <strong>Display Name:</strong>{' '}
                                    {profile?.display_name || 'Not set'}
                                </div>
                                <div>
                                    <strong>Loading:</strong>{' '}
                                    <Badge variant={loading ? 'secondary' : 'outline'}>
                                        {loading.toString()}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile & Role */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Profile & Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <strong>DB Role:</strong>{' '}
                                    {dbRole ? (
                                        <RolePill role={dbRole} />
                                    ) : (
                                        <span className="text-neutral-400 italic">No role</span>
                                    )}
                                </div>
                                <div>
                                    <strong>JWT Role:</strong>{' '}
                                    {jwtRole ? (
                                        <RolePill role={jwtRole} />
                                    ) : (
                                        <span className="text-neutral-400 italic">No role</span>
                                    )}
                                </div>
                                <div>
                                    <strong>Role Sync:</strong>{' '}
                                    <Badge variant={rolesSynced ? 'default' : 'destructive'}>
                                        {rolesSynced ? 'Synchronized' : 'Out of sync'}
                                    </Badge>
                                </div>
                                <div>
                                    <strong>Profile ID:</strong>{' '}
                                    <code className="text-xs bg-muted p-1 rounded">
                                        {profile?.id || 'null'}
                                    </code>
                                </div>
                                <div>
                                    <strong>User ID:</strong>{' '}
                                    <code className="text-xs bg-muted p-1 rounded">
                                        {user?.id || 'null'}
                                    </code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong>ID Status:</strong>
                                    <Badge variant={getProfileIdStatus().status === 'synced' ? 'default' : 'destructive'}>
                                        {getProfileIdStatus().message}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong>Admin Access:</strong>
                                    <Badge variant={hasAdminAccessValue ? 'default' : 'destructive'}>
                                        {hasAdminAccessValue ? 'Granted' : 'Denied'}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <strong>Reason:</strong> {getAdminAccessReason()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Session Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="w-5 h-5" />
                                    Session Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <strong>Session Active:</strong>{' '}
                                    <Badge variant={session ? 'default' : 'destructive'}>
                                        {session ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                                <div>
                                    <strong>Access Token:</strong>{' '}
                                    <Badge variant={session?.access_token ? 'default' : 'destructive'}>
                                        {session?.access_token ? 'Present' : 'Missing'}
                                    </Badge>
                                </div>
                                <div>
                                    <strong>Expires At:</strong>{' '}
                                    {session?.expires_at ?
                                        new Date(session.expires_at * 1000).toLocaleString() :
                                        'Not set'
                                    }
                                </div>
                                <div>
                                    <strong>Provider:</strong>{' '}
                                    {user?.app_metadata?.provider || 'Unknown'}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Language & Environment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Language & Environment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <strong>Current Language:</strong>{' '}
                                    <Badge variant="secondary">{language}</Badge>
                                </div>
                                <div>
                                    <strong>Language Source:</strong>{' '}
                                    <Badge variant="outline">
                                        {localStorage.getItem('preferredLanguage') ? 'localStorage' :
                                            profile?.preferred_language ? 'profile' : 'default'}
                                    </Badge>
                                </div>
                                <div>
                                    <strong>Preferred Language:</strong>{' '}
                                    {profile?.preferred_language || 'Not set'}
                                </div>
                                <div>
                                    <strong>Environment:</strong>{' '}
                                    <Badge variant="outline">
                                        {process.env.NODE_ENV || 'development'}
                                    </Badge>
                                </div>
                                <div>
                                    <strong>URL:</strong>{' '}
                                    <code className="text-xs bg-muted p-1 rounded break-all">
                                        {window.location.href}
                                    </code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Role Management Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Management</CardTitle>
                            <CardDescription>Development tools for role synchronization</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3 flex-wrap">
                                <Button
                                    onClick={handleRefreshRole}
                                    disabled={refreshing}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh Role from DB
                                </Button>

                                <Button
                                    onClick={handleSyncRole}
                                    disabled={syncing || rolesSynced}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RotateCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                    Sync Role to JWT
                                </Button>

                                <Button
                                    onClick={handleEnsureSuperadmin}
                                    disabled={promoting}
                                    variant="destructive"
                                    size="sm"
                                >
                                    <Crown className={`w-4 h-4 mr-2 ${promoting ? 'animate-spin' : ''}`} />
                                    Emergency SuperAdmin
                                </Button>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                <p><strong>Refresh Role:</strong> Re-fetch profile data from database</p>
                                <p><strong>Sync Role:</strong> Update JWT token with database role</p>
                                <p><strong>Emergency SuperAdmin:</strong> Promote current user if no superadmin exists</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Navigation</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-3 flex-wrap">
                            <Button asChild variant="outline">
                                <Link to="/">Home Page</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/profile">Profile Page</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/admin">Admin Panel</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/auth">Auth Page</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Raw Data (Collapsed) */}
                    <details className="bg-muted/50 p-4 rounded-lg">
                        <summary className="cursor-pointer font-medium mb-2">
                            🔍 Raw Debug Data (Click to expand)
                        </summary>
                        <div className="space-y-4 text-sm">
                            <div>
                                <strong>User Object:</strong>
                                <pre className="bg-background p-2 rounded mt-1 overflow-auto text-xs">
                                    {JSON.stringify(user, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <strong>Profile Object:</strong>
                                <pre className="bg-background p-2 rounded mt-1 overflow-auto text-xs">
                                    {JSON.stringify(profile, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <strong>Session Object:</strong>
                                <pre className="bg-background p-2 rounded mt-1 overflow-auto text-xs">
                                    {JSON.stringify(session ? {
                                        ...session,
                                        access_token: session.access_token ? '[REDACTED]' : null,
                                        refresh_token: session.refresh_token ? '[REDACTED]' : null
                                    } : null, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </Layout>
    );
};

export default DebugAuthPage;