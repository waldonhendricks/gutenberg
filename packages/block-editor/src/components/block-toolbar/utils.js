/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';

const {
	cancelAnimationFrame,
	clearTimeout,
	setTimeout,
	requestAnimationFrame,
} = window;

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

const EDITOR_SELECTOR = '.editor-styles-wrapper';

/**
 * This is SUPER experimental. Please do not implement this directly.
 */
export function useSuperExperimentalToolbarPositioning( { ref } ) {
	const containerNode = document.querySelector( EDITOR_SELECTOR );

	// MATH values
	const moverWidth = 48;
	const buffer = 8;
	const offsetLeft = moverWidth + buffer;

	const updatePosition = useCallback( () => {
		const node = ref.current;
		if ( ! node ) return;

		const targetNode = node.parentElement;

		const {
			x: containerX,
			width: containerWidth,
		} = containerNode.getBoundingClientRect();
		const {
			x: nodeX,
			width: nodeWidth,
			left: nodeLeft,
		} = targetNode.getBoundingClientRect();

		if ( nodeLeft < 0 ) return;

		let nextTranslateX;

		// Computed values
		const containerRight = containerWidth + containerX;
		const nodeRight = nodeX + nodeWidth;
		const totalOffsetLeft = nodeX - offsetLeft;

		const isOverflowLeft = totalOffsetLeft < containerX;
		const isOverflowRight = nodeRight > containerRight;

		if ( isOverflowLeft ) {
			nextTranslateX = containerX - totalOffsetLeft;
		} else if ( isOverflowRight ) {
			nextTranslateX = containerRight - nodeRight - buffer;
		}

		if ( nextTranslateX ) {
			targetNode.style.transform = `translateX(${ nextTranslateX }px)`;
		}

		targetNode.style.opacity = 1;
	}, [] );

	useHideOnInitialRender( { ref } );
	useRequestAnimationFrameLoop( updatePosition );
}

export function useHideOnInitialRender( { ref } ) {
	useEffect( () => {
		const node = ref.current;
		if ( ! node ) return;

		const targetNode = node.parentElement;
		targetNode.style.opacity = 0;
	}, [ ref ] );
}

export function useRequestAnimationFrameLoop( callback ) {
	const rafLoopRef = useRef();

	const rafCallback = ( ...args ) => {
		if ( callback ) {
			callback( ...args );
		}
		rafLoopRef.current = requestAnimationFrame( rafCallback );
	};

	useEffect( () => {
		const cancelAnimationLoop = () => {
			if ( rafLoopRef.current ) {
				cancelAnimationFrame( rafLoopRef.current );
			}
		};

		rafLoopRef.current = requestAnimationFrame( rafCallback );

		return () => {
			cancelAnimationLoop();
		};
	}, [ rafLoopRef ] );
}
