import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMatches(media.matches);

        const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

        // Modern browsers support addEventListener on MediaQueryList, but Safari < 14 uses addListener
        if (media.addEventListener) {
            media.addEventListener("change", listener);
            return () => media.removeEventListener("change", listener);
        } else {
            // Fallback
            // @ts-ignore
            media.addListener(listener);
            // @ts-ignore
            return () => media.removeListener(listener);
        }
    }, [query]);

    return matches;
}
