import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const PasswordChangeForm = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);

  // Check if this is the specific user who needs to change password
  const needsPasswordChange = user?.email === 'valera.dreus2001@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: t('errors.passwordMismatch', 'Password Mismatch'),
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: t('errors.passwordTooShort', 'Password Too Short'), 
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: t('profile.passwordChanged', 'Password Changed'),
        description: 'Your password has been updated successfully',
      });

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setShowForceChange(false);

    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: t('errors.passwordChangeError', 'Password Change Error'),
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Force password change alert for specific user */}
      {needsPasswordChange && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> Your password was compromised and needs to be changed immediately for security reasons.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {t('profile.changePassword', 'Change Password')}
          </CardTitle>
          <CardDescription>
            {t('profile.changePasswordDescription', 'Update your account password')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t('profile.newPassword', 'New Password')}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('profile.confirmPassword', 'Confirm New Password')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            {formData.newPassword && formData.confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {formData.newPassword === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 w-4 text-destructive" />
                    <span className="text-destructive">Passwords do not match</span>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                className="flex-1"
              >
                {isLoading ? 'Changing...' : t('profile.changePassword', 'Change Password')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password security tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Password Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Use at least 8 characters with a mix of letters, numbers, and symbols</li>
            <li>Avoid using personal information or common words</li>
            <li>Don't reuse passwords from other accounts</li>
            <li>Consider using a password manager</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordChangeForm;