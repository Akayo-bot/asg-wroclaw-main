import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

interface UIString {
  id: string;
  key: string;
  category: string;
  text_uk: string;
  text_ru: string;
  text_pl: string;
  text_en: string;
}

const TranslationsManager = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [strings, setStrings] = useState<UIString[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingString, setEditingString] = useState<UIString | null>(null);

  const categories = ['all', 'hero', 'games', 'team', 'contact', 'navigation', 'auth', 'admin', 'buttons', 'status', 'language'];

  useEffect(() => {
    fetchStrings();
  }, []);

  const fetchStrings = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_strings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;
      setStrings(data || []);
    } catch (error) {
      console.error('Error fetching strings:', error);
      toast({
        title: "Error",
        description: "Failed to load translations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveString = async (stringData: UIString) => {
    try {
      const { error } = await supabase
        .from('ui_strings')
        .update({
          text_uk: stringData.text_uk,
          text_ru: stringData.text_ru,
          text_pl: stringData.text_pl,
          text_en: stringData.text_en,
          updated_at: new Date().toISOString()
        })
        .eq('id', stringData.id);

      if (error) throw error;

      setStrings(prev => prev.map(s => s.id === stringData.id ? stringData : s));
      setEditingString(null);
      
      toast({
        title: "Success",
        description: "Translation saved successfully"
      });
    } catch (error) {
      console.error('Error saving string:', error);
      toast({
        title: "Error",
        description: "Failed to save translation",
        variant: "destructive"
      });
    }
  };

  const filteredStrings = strings.filter(string => {
    const matchesSearch = string.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         string.text_uk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         string.text_ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         string.text_pl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         string.text_en.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || string.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getMissingTranslations = (string: UIString) => {
    const missing = [];
    if (!string.text_uk.trim()) missing.push('UK');
    if (!string.text_ru.trim()) missing.push('RU');
    if (!string.text_pl.trim()) missing.push('PL');
    if (!string.text_en.trim()) missing.push('EN');
    return missing;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading translations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-rajdhani font-bold">
          {t('admin.translations.title', 'Translation Management')}
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.translations.search', 'Search keys...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStrings.map((string) => {
          const missingTranslations = getMissingTranslations(string);
          const isEditing = editingString?.id === string.id;
          
          return (
            <Card key={string.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-mono">{string.key}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{string.category}</Badge>
                      {missingTranslations.length > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Missing: {missingTranslations.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={isEditing ? "destructive" : "outline"}
                    onClick={() => setEditingString(isEditing ? null : string)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-1">Ukrainian (UK)</label>
                        <Textarea
                          value={editingString.text_uk}
                          onChange={(e) => setEditingString({...editingString, text_uk: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Russian (RU)</label>
                        <Textarea
                          value={editingString.text_ru}
                          onChange={(e) => setEditingString({...editingString, text_ru: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Polish (PL)</label>
                        <Textarea
                          value={editingString.text_pl}
                          onChange={(e) => setEditingString({...editingString, text_pl: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">English (EN)</label>
                        <Textarea
                          value={editingString.text_en}
                          onChange={(e) => setEditingString({...editingString, text_en: e.target.value})}
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => saveString(editingString)}
                        className="gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {t('admin.translations.save', 'Save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="text-sm">UK:</strong> 
                      <p className="text-sm mt-1">{string.text_uk || <span className="text-muted-foreground italic">Empty</span>}</p>
                    </div>
                    <div>
                      <strong className="text-sm">RU:</strong> 
                      <p className="text-sm mt-1">{string.text_ru || <span className="text-muted-foreground italic">Empty</span>}</p>
                    </div>
                    <div>
                      <strong className="text-sm">PL:</strong> 
                      <p className="text-sm mt-1">{string.text_pl || <span className="text-muted-foreground italic">Empty</span>}</p>
                    </div>
                    <div>
                      <strong className="text-sm">EN:</strong> 
                      <p className="text-sm mt-1">{string.text_en || <span className="text-muted-foreground italic">Empty</span>}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStrings.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No translations found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default TranslationsManager;