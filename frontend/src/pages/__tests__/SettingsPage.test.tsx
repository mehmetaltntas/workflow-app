import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '../SettingsPage';

// Mock child section components
vi.mock('../../components/settings/ProfileSection', () => ({
  default: ({ userId }: { userId: number }) => (
    <div data-testid="profile-section">ProfileSection userId={userId}</div>
  ),
}));

vi.mock('../../components/settings/PrivacySection', () => ({
  default: ({ userId }: { userId: number }) => (
    <div data-testid="privacy-section">PrivacySection userId={userId}</div>
  ),
}));

vi.mock('../../components/settings/SecuritySection', () => ({
  default: ({ userId }: { userId: number }) => (
    <div data-testid="security-section">SecuritySection userId={userId}</div>
  ),
}));

vi.mock('../../components/settings/AccountSection', () => ({
  default: ({ userId }: { userId: number }) => (
    <div data-testid="account-section">AccountSection userId={userId}</div>
  ),
}));

// Mock authStore
const mockAuthState = {
  userId: 1 as number | null,
  login: vi.fn(),
  deletionScheduledAt: null as string | null,
  setDeletionScheduledAt: vi.fn(),
};

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: typeof mockAuthState) => unknown) =>
    selector(mockAuthState)
  ),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    mockAuthState.userId = 1;
    vi.clearAllMocks();
  });

  it('should return null when user is not authenticated', () => {
    mockAuthState.userId = null;

    const { container } = render(<SettingsPage />);
    expect(container.innerHTML).toBe('');
  });

  it('should render page header with title', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    expect(screen.getByText('Hesap ve uygulama ayarlarınızı yönetin')).toBeInTheDocument();
  });

  it('should render all navigation menu items', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Gizlilik')).toBeInTheDocument();
    expect(screen.getByText('Güvenlik')).toBeInTheDocument();
    expect(screen.getByText('Hesap')).toBeInTheDocument();
  });

  it('should render ProfileSection by default', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
  });

  it('should switch to privacy section when clicked', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Gizlilik'));

    expect(screen.getByTestId('privacy-section')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument();
  });

  it('should switch to security section when clicked', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Güvenlik'));

    expect(screen.getByTestId('security-section')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument();
  });

  it('should switch to account section when clicked', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Hesap'));

    expect(screen.getByTestId('account-section')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument();
  });

  it('should render menu item descriptions', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Profil bilgilerinizi düzenleyin')).toBeInTheDocument();
    expect(screen.getByText('Profil gizlilik ayarları')).toBeInTheDocument();
    expect(screen.getByText('Şifre ve güvenlik ayarları')).toBeInTheDocument();
    expect(screen.getByText('Hesap silme işlemleri')).toBeInTheDocument();
  });
});
