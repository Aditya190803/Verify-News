import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Lock, Eye, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { getUserSettings, saveUserSettings } from "@/services/appwrite";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser: user } = useAuth();
  const { t, i18n } = useTranslation();

  const [settings, setSettings] = useState({
    theme: localStorage.getItem("theme") || "system",
    notifications: localStorage.getItem("notifications") === "true",
    emailNotifications: localStorage.getItem("emailNotifications") === "true",
    privateProfile: localStorage.getItem("privateProfile") === "true",
    dataCollection: localStorage.getItem("dataCollection") === "true",
    language: localStorage.getItem("language") || "en",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const dbSettings = await getUserSettings(user.id);
          if (dbSettings) {
            setSettings({
              theme: dbSettings.theme,
              notifications: dbSettings.notifications,
              emailNotifications: dbSettings.emailNotifications,
              privateProfile: dbSettings.privateProfile,
              dataCollection: dbSettings.dataCollection,
              language: dbSettings.language,
            });
            
            // Sync with localStorage for offline/immediate use
            localStorage.setItem("theme", dbSettings.theme);
            localStorage.setItem("notifications", String(dbSettings.notifications));
            localStorage.setItem("emailNotifications", String(dbSettings.emailNotifications));
            localStorage.setItem("privateProfile", String(dbSettings.privateProfile));
            localStorage.setItem("dataCollection", String(dbSettings.dataCollection));
            localStorage.setItem("language", dbSettings.language);
            
            if (dbSettings.language) {
              i18n.changeLanguage(dbSettings.language);
            }
          }
        } catch (error) {
          console.error("Failed to load settings from DB:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
  }, [user?.id, i18n]);

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
    
    if (key === 'language' && typeof value === 'string') {
      i18n.changeLanguage(value);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem("theme", settings.theme);
      localStorage.setItem("notifications", String(settings.notifications));
      localStorage.setItem("emailNotifications", String(settings.emailNotifications));
      localStorage.setItem("privateProfile", String(settings.privateProfile));
      localStorage.setItem("dataCollection", String(settings.dataCollection));
      localStorage.setItem("language", settings.language);

      // Save to DB if user is logged in
      if (user?.id) {
        await saveUserSettings(user.id, settings);
      }

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
      setHasChanges(false);
    } catch (_error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      theme: localStorage.getItem("theme") || "system",
      notifications: localStorage.getItem("notifications") === "true",
      emailNotifications: localStorage.getItem("emailNotifications") === "true",
      privateProfile: localStorage.getItem("privateProfile") === "true",
      dataCollection: localStorage.getItem("dataCollection") === "true",
      language: localStorage.getItem("language") || "en",
    });
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            disabled={isLoading}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
            <p className="text-muted-foreground">Manage your preferences and account settings</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription>Customize how VerifyNews looks to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">{t('settings.theme')}</label>
                <div className="flex gap-3">
                  {[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                    { value: "system", label: "System" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={settings.theme === option.value ? "default" : "outline"}
                      onClick={() => handleSettingChange("theme", option.value)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('settings.notifications')}
              </CardTitle>
              <CardDescription>Control how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about verification updates
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(value) =>
                    handleSettingChange("notifications", value)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get email updates on your fact-checks
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(value) =>
                    handleSettingChange("emailNotifications", value)
                  }
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange("language", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isLoading}
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="mr">Marathi (मराठी)</option>
              </select>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('settings.privacy')}
              </CardTitle>
              <CardDescription>Manage your privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Private Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Make your verification history private
                  </p>
                </div>
                <Switch
                  checked={settings.privateProfile}
                  onCheckedChange={(value) =>
                    handleSettingChange("privateProfile", value)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Collection</p>
                  <p className="text-sm text-muted-foreground">
                    Allow us to collect usage data for improvements
                  </p>
                </div>
                <Switch
                  checked={settings.dataCollection}
                  onCheckedChange={(value) =>
                    handleSettingChange("dataCollection", value)
                  }
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          {user && (
            <Card className={isLoading ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>{t('settings.account')}</CardTitle>
                <CardDescription>Your current account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{user.email || "Not available"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-base font-mono text-sm">{user.id || "Not available"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isLoading}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
