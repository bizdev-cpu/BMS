export const Icon = ({ name, className = "w-5 h-5" }) => {
            const icons = {
                dashboard: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                    </svg>
                ),
                project: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12" />
                    </svg>
                ),
                rental: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                    </svg>
                ),
                kdt: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A57.778 57.778 0 0 1 12 8c4.72 0 9 2.1 9 3.325V15" />
                    </svg>
                ),
                settings: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                    </svg>
                ),
                database: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75C4.5 8.407 7.858 9.75 12 9.75s7.5-1.343 7.5-3-3.358-3-7.5-3-7.5 1.343-7.5 3Z"/> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75v5.25c0 1.657 3.358 3 7.5 3s7.5-1.343 7.5-3V6.75"/>
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12v5.25c0 1.657 3.358 3 7.5 3s7.5-1.343 7.5-3V12"
                        />
                    </svg>
                    ),
                plus: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                ),
                edit: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.04a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                ),
                delete: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.24 9m4.788-1.717-.7 10.742m-4.76-10.742-.7-10.742m4.76 0a3 3 0 0 0-5.468 0M6 3h12m0 0v13.5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V3" />
                    </svg>
                ),
                warning: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                ),
                comment: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21v-3.378c.833-.015 1.662-.057 2.483-.127a3.001 3.001 0 0 0 2.507-2.775V8.25a3 3 0 0 0-3-3h-9.5A3 3 0 0 0 2.25 8.25v6.75Z" />
                    </svg>
                ),
                check: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                ),
                close: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                ),
                info: (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.054.955l-1.5 4a.75.75 0 0 1-1.391-.45l1.5-4a.75.75 0 0 1-.204-.485ZM12 9h.008v.008H12V9Zm9 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                )
            };
            return icons[name] || null;
};

export default Icon;