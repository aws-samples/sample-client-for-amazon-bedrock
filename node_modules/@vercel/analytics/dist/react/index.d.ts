interface PageViewEvent {
    type: 'pageview';
    url: string;
}
declare type Event = PageViewEvent;
declare type Mode = 'auto' | 'development' | 'production';
declare type BeforeSend = (event: Event) => Event | null;
interface AnalyticsProps {
    beforeSend?: BeforeSend;
    debug?: boolean;
    mode?: Mode;
}
declare global {
    interface Window {
        va?: (event: string, properties?: unknown) => void;
        vaq?: [string, unknown?][];
        vai?: boolean;
    }
}

declare function Analytics({ beforeSend, debug, mode, }: AnalyticsProps): null;

export { Analytics, AnalyticsProps };
