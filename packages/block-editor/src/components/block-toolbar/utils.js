/**
 * WordPress dependencies
 */
import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useLayoutEffect,
} from '@wordpress/element';

const { clearTimeout, setTimeout, requestAnimationFrame } = window;

/**
 * Hook that creates a showMover state, as well as debounced show/hide callbacks
 */
export function useDebouncedShowMovers( {
	ref,
	isFocused,
	debounceTimeout = 500,
} ) {
	const [ showMovers, setShowMovers ] = useState( false );
	const timeoutRef = useRef();

	const getIsHovered = () => {
		return ref && ref.current.matches( ':hover' );
	};

	const shouldHideMovers = () => {
		const isHovered = getIsHovered();

		return ! isFocused && ! isHovered;
	};

	const debouncedShowMovers = useCallback(
		( event ) => {
			if ( event ) {
				event.stopPropagation();
			}

			const timeout = timeoutRef.current;

			if ( timeout && clearTimeout ) {
				clearTimeout( timeout );
			}
			if ( ! showMovers ) {
				setShowMovers( true );
			}
		},
		[ showMovers ]
	);

	const debouncedHideMovers = useCallback(
		( event ) => {
			if ( event ) {
				event.stopPropagation();
			}

			timeoutRef.current = setTimeout( () => {
				if ( shouldHideMovers() ) {
					setShowMovers( false );
				}
			}, debounceTimeout );
		},
		[ isFocused ]
	);

	return {
		showMovers,
		debouncedShowMovers,
		debouncedHideMovers,
	};
}

/**
 * Hook that provides a showMovers state and gesture events for DOM elements
 * that interact with the showMovers state.
 */
export function useShowMoversGestures( { ref, debounceTimeout = 500 } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const {
		showMovers,
		debouncedShowMovers,
		debouncedHideMovers,
	} = useDebouncedShowMovers( { ref, debounceTimeout, isFocused } );

	const registerRef = useRef( false );

	const isFocusedWithin = () => {
		return ref && ref.current.contains( document.activeElement );
	};

	useEffect( () => {
		const node = ref.current;

		const handleOnFocus = () => {
			if ( isFocusedWithin() ) {
				setIsFocused( true );
				debouncedShowMovers();
			}
		};

		const handleOnBlur = () => {
			if ( ! isFocusedWithin() ) {
				setIsFocused( false );
				debouncedHideMovers();
			}
		};

		/**
		 * Events are added via DOM events (vs. React synthetic events),
		 * as the child React components swallow mouse events.
		 */
		if ( node && ! registerRef.current ) {
			node.addEventListener( 'focus', handleOnFocus, true );
			node.addEventListener( 'blur', handleOnBlur, true );
			registerRef.current = true;
		}

		return () => {
			if ( node ) {
				node.removeEventListener( 'focus', handleOnFocus );
				node.removeEventListener( 'blur', handleOnBlur );
			}
		};
	}, [
		ref,
		registerRef,
		setIsFocused,
		debouncedShowMovers,
		debouncedHideMovers,
	] );

	return {
		showMovers,
		gestures: {
			onMouseMove: debouncedShowMovers,
			onMouseLeave: debouncedHideMovers,
		},
	};
}

const EDITOR_SELECTOR = '.edit-post-layout';
const POPOVER_RENDER_TIMEOUT = 30;

/**
 * This is SUPER experimental. Please do not implement this directly.
 */
export function useSuperExperimentalToolbarPositioning( { ref } ) {
	const transformTimeout = useRef();
	const DATA_ATTR = 'data-transform-offset';

	useLayoutEffect( () => {
		const containerNode = ref.current;

		const clearTransformTimeout = () => {
			if ( transformTimeout.current ) {
				clearTimeout( transformTimeout.current );
			}
		};

		clearTransformTimeout();

		const reposition = () => {
			requestAnimationFrame( () => {
				if ( ! containerNode ) return;
				const editorNode = document.querySelector( EDITOR_SELECTOR );
				const targetNode = containerNode.parentElement;

				const { x: editorX } = editorNode.getBoundingClientRect();
				const { x: nodeX } = containerNode.getBoundingClientRect();

				const currentOffsetData =
					containerNode.getAttribute( DATA_ATTR ) || 0;
				const currentOffset = parseFloat( currentOffsetData );
				const outerOffset = 48;
				const buffer = 8;
				const innerOffset = nodeX - editorX;
				const diff = outerOffset - innerOffset + currentOffset;

				const nextTranslateX = diff > 0 ? diff + buffer : 0;

				targetNode.style.transform = `translateX(${ nextTranslateX }px)`;

				containerNode.setAttribute( DATA_ATTR, nextTranslateX );
			} );
		};

		transformTimeout.current = setTimeout( () => {
			const targetNode = containerNode.parentElement;
			targetNode.style.opacity = 0;

			reposition();

			targetNode.style.opacity = 1;
		}, POPOVER_RENDER_TIMEOUT );

		window.addEventListener( 'resize', reposition );

		return () => {
			clearTransformTimeout();
			window.removeEventListener( 'resize', reposition );
		};
	}, [ ref, transformTimeout ] );
}
