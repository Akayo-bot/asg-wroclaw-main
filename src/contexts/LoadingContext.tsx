import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

interface LoadingContextType {
    isLoading: boolean;
    showLoading: (label?: string) => void;
    hideLoading: () => void;
    withLoading: <T>(promise: Promise<T>, label?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
    children: ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState('SCANNING TARGETS…');

    const showLoading = useCallback((label = 'SCANNING TARGETS…') => {
        setLoadingLabel(label);
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const withLoading = useCallback(async <T,>(
        promise: Promise<T>,
        label = 'SCANNING TARGETS…'
    ): Promise<T> => {
        showLoading(label);
        try {
            const result = await promise;
            return result;
        } finally {
            hideLoading();
        }
    }, [showLoading, hideLoading]);

    return (
        <LoadingContext.Provider
            value={{
                isLoading,
                showLoading,
                hideLoading,
                withLoading
            }}
        >
            {children}
            <LoadingOverlay isLoading={isLoading} label={loadingLabel} />
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within LoadingProvider');
    }
    return context;
};

