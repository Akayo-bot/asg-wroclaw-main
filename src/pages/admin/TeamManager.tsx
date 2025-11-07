import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, User, GripVertical, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type TeamMember = Tables<'team_members'>;

interface TeamMemberForm {
    callsign: string;
    real_name: string;
    role_uk: string;
    role_ru: string;
    role_pl: string;
    bio_uk: string;
    bio_ru: string;
    bio_pl: string;
    photo_url: string;
    is_active: boolean;
    display_order: number;
    social_links: any;
}

const TeamManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<TeamMemberForm>({
        callsign: '',
        real_name: '',
        role_uk: '',
        role_ru: '',
        role_pl: '',
        bio_uk: '',
        bio_ru: '',
        bio_pl: '',
        photo_url: '',
        is_active: true,
        display_order: 0,
        social_links: {},
    });

    useEffect(() => {
        fetchMembers();
    }, [activeFilter]);

    const fetchMembers = async () => {
        try {
            let query = supabase.from('team_members').select('*');

            if (activeFilter !== 'all') {
                query = query.eq('is_active', activeFilter === 'active');
            }

            query = query.order('display_order', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;

            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching team members:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('team.fetch_error', 'Failed to fetch team members'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const memberData = {
                ...formData,
                social_links: formData.social_links || {},
            };

            if (editingMember) {
                const { error } = await supabase
                    .from('team_members')
                    .update({
                        ...memberData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingMember.id);

                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('team.updated', 'Team member updated successfully'),
                });
            } else {
                // Set display_order to the next available number
                const maxOrder = Math.max(...members.map(m => m.display_order), -1);
                memberData.display_order = maxOrder + 1;

                const { error } = await supabase
                    .from('team_members')
                    .insert(memberData);

                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('team.created', 'Team member created successfully'),
                });
            }

            resetForm();
            fetchMembers();
        } catch (error) {
            console.error('Error saving team member:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('team.save_error', 'Failed to save team member'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteMember = async (id: string) => {
        if (!confirm(t('team.confirm_delete', 'Are you sure you want to delete this team member?'))) return;

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMembers(members.filter(member => member.id !== id));
            toast({
                title: t('common.success', 'Success'),
                description: t('team.deleted', 'Team member deleted successfully'),
            });
        } catch (error) {
            console.error('Error deleting team member:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('team.delete_error', 'Failed to delete team member'),
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setFormData({
            callsign: '',
            real_name: '',
            role_uk: '',
            role_ru: '',
            role_pl: '',
            bio_uk: '',
            bio_ru: '',
            bio_pl: '',
            photo_url: '',
            is_active: true,
            display_order: 0,
            social_links: {},
        });
        setEditingMember(null);
        setIsDialogOpen(false);
    };

    const editMember = (member: TeamMember) => {
        setEditingMember(member);
        setFormData({
            callsign: member.callsign,
            real_name: member.real_name || '',
            role_uk: member.role_uk,
            role_ru: member.role_ru,
            role_pl: member.role_pl,
            bio_uk: member.bio_uk || '',
            bio_ru: member.bio_ru || '',
            bio_pl: member.bio_pl || '',
            photo_url: member.photo_url || '',
            is_active: member.is_active,
            display_order: member.display_order,
            social_links: member.social_links || {},
        });
        setIsDialogOpen(true);
    };

    const getRole = (member: TeamMember) => {
        const roles = {
            uk: member.role_uk,
            ru: member.role_ru,
            pl: member.role_pl,
            en: member.role_uk, // fallback
        };
        return roles[language] || member.role_uk;
    };

    const filteredMembers = members.filter(member => {
        if (searchTerm) {
            const callsign = member.callsign.toLowerCase();
            const realName = member.real_name?.toLowerCase() || '';
            const role = getRole(member).toLowerCase();
            if (!callsign.includes(searchTerm.toLowerCase()) &&
                !realName.includes(searchTerm.toLowerCase()) &&
                !role.includes(searchTerm.toLowerCase())) {
                return false;
            }
        }
        return true;
    });

    if (loading && members.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('team.title', 'Team Management')}</h1>
                    <p className="text-muted-foreground">{t('team.description', 'Manage your team members and roles')}</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('team.add_member', 'Add Member')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingMember ? t('team.edit_member', 'Edit Team Member') : t('team.add_member', 'Add Team Member')}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="callsign">{t('team.callsign', 'Callsign')}</Label>
                                    <Input
                                        id="callsign"
                                        value={formData.callsign}
                                        onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                                        placeholder="RAVEN-01"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="real_name">{t('team.real_name', 'Real Name (optional)')}</Label>
                                    <Input
                                        id="real_name"
                                        value={formData.real_name}
                                        onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="photo_url">{t('team.photo_url', 'Photo URL')}</Label>
                                    <Input
                                        id="photo_url"
                                        value={formData.photo_url}
                                        onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                                        placeholder="https://example.com/photo.jpg"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="display_order">{t('team.display_order', 'Display Order')}</Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="is_active">{t('team.is_active', 'Active Member')}</Label>
                                </div>
                            </div>

                            <Tabs defaultValue="uk" className="space-y-4">
                                <TabsList>
                                    <TabsTrigger value="uk">🇺🇦 Українська</TabsTrigger>
                                    <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
                                    <TabsTrigger value="pl">🇵🇱 Polski</TabsTrigger>
                                    <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                                </TabsList>

                                {['uk', 'ru', 'pl', 'en'].map((lang) => (
                                    <TabsContent key={lang} value={lang} className="space-y-4">
                                        <div>
                                            <Label htmlFor={`role_${lang}`}>{t('team.role_field', 'Role')}</Label>
                                            <Input
                                                id={`role_${lang}`}
                                                value={formData[`role_${lang}` as keyof TeamMemberForm]}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [`role_${lang}`]: e.target.value
                                                })}
                                                placeholder={t('team.role_placeholder', 'Team Leader, Sniper, Medic...')}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor={`bio_${lang}`}>{t('team.bio_field', 'Bio')}</Label>
                                            <Textarea
                                                id={`bio_${lang}`}
                                                value={formData[`bio_${lang}` as keyof TeamMemberForm]}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [`bio_${lang}`]: e.target.value
                                                })}
                                                placeholder={t('team.bio_placeholder', 'Member biography and experience')}
                                                rows={4}
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('team.search_placeholder', 'Search team members...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={activeFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('all')}
                        size="sm"
                    >
                        {t('common.all', 'All')}
                    </Button>
                    <Button
                        variant={activeFilter === 'active' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('active')}
                        size="sm"
                    >
                        {t('team.active', 'Active')}
                    </Button>
                    <Button
                        variant={activeFilter === 'inactive' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('inactive')}
                        size="sm"
                    >
                        {t('team.inactive', 'Inactive')}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => (
                    <Card key={member.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                <div className="relative">
                                    {member.photo_url ? (
                                        <img
                                            src={member.photo_url}
                                            alt={member.callsign}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    {!member.is_active && (
                                        <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1">
                                            {t('team.inactive', 'Inactive')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{member.callsign}</CardTitle>
                                    {member.real_name && (
                                        <p className="text-sm text-muted-foreground">{member.real_name}</p>
                                    )}
                                    <p className="text-sm font-medium">{getRole(member)}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <Badge variant="outline" className="text-xs">
                                    {t('team.order', 'Order')}: {member.display_order}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => editMember(member)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteMember(member.id)}
                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">{t('team.no_members', 'No team members found')}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TeamManager;