/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';

export default function BlockToolbar( { hideDragHandle } ) {
	const {
		blockClientIds,
		isValid,
		mode,
		moverDirection,
		hasMovers = true,
	} = useSelect( ( select ) => {
		const {
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockListSettings,
		} = select( 'core/block-editor' );

		const selectedBlockClientIds = getSelectedBlockClientIds();
		const blockRootClientId = getBlockRootClientId(
			selectedBlockClientIds[ 0 ]
		);

		const { __experimentalMoverDirection, __experimentalUIParts = {} } =
			getBlockListSettings( blockRootClientId ) || {};

		return {
			blockClientIds: selectedBlockClientIds,
			rootClientId: blockRootClientId,
			isValid:
				selectedBlockClientIds.length === 1
					? isBlockValid( selectedBlockClientIds[ 0 ] )
					: null,
			mode:
				selectedBlockClientIds.length === 1
					? getBlockMode( selectedBlockClientIds[ 0 ] )
					: null,
			moverDirection: __experimentalMoverDirection,
			hasMovers: __experimentalUIParts.hasMovers,
		};
	}, [] );

	const nodeRef = useRef();
	const showMovers = useShowMovers( { ref: nodeRef } );

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && mode === 'visual';
	const isMultiToolbar = blockClientIds.length > 1;

	const shouldShowMovers = showMovers && hasMovers;
	const classes = classnames(
		'block-editor-block-toolbar',
		shouldShowMovers && 'is-withMovers'
	);

	// TODO: Refactor to CSS styles
	const forcedBlockMoverWrapperStyles = {
		backgroundColor: 'white',
		border: '1px solid black',
		borderBottomLeftRadius: 2,
		borderRight: 'none',
		borderTopLeftRadius: 2,
		left: -1,
		position: 'absolute',
		top: -1,
		transition: 'all 60ms linear',
		userSelect: 'none',
		zIndex: -1,
		// interpolated values, based on whether movers should show
		pointerEvents: shouldShowMovers ? 'all' : 'none',
		opacity: shouldShowMovers ? 1 : 0,
		transform: shouldShowMovers ? 'translateX(-48px)' : 'translateX(0)',
	};

	return (
		<div className={ classes } ref={ nodeRef }>
			<div style={ forcedBlockMoverWrapperStyles }>
				<BlockMover
					clientIds={ blockClientIds }
					__experimentalOrientation={ moverDirection }
					hideDragHandle={ hideDragHandle }
				/>
			</div>
			{ ( shouldShowVisualToolbar || isMultiToolbar ) && (
				<BlockSwitcher clientIds={ blockClientIds } />
			) }
			{ shouldShowVisualToolbar && ! isMultiToolbar && (
				<>
					<BlockControls.Slot
						bubblesVirtually
						className="block-editor-block-toolbar__slot"
					/>
					<BlockFormatControls.Slot
						bubblesVirtually
						className="block-editor-block-toolbar__slot"
					/>
				</>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}

function useShowMovers( { ref, debounceTimeout = 300 } ) {
	const [ showMovers, setShowMovers ] = useState( false );
	const timeoutRef = useRef();

	useEffect( () => {
		const node = ref.current;
		const { setTimeout, clearTimeout } = window;

		const isFocusedWithin = () => {
			return node.contains( document.activeElement );
		};

		const handleOnDocumentFocus = () => {
			if ( isFocusedWithin() && ! showMovers ) {
				setShowMovers( true );
			}
		};

		const handleOnMouseMove = () => {
			const timeout = timeoutRef.current;

			if ( timeout && clearTimeout ) {
				clearTimeout( timeout );
			}
			if ( ! showMovers ) {
				setShowMovers( true );
			}
		};

		const handleOnMouseLeave = () => {
			if ( showMovers && ! isFocusedWithin() ) {
				timeoutRef.current = setTimeout( () => {
					setShowMovers( false );
				}, debounceTimeout );
			}
		};

		/**
		 * Events are added via DOM events (vs. React synthetic events),
		 * as the child React components swallow mouse events.
		 */
		if ( node ) {
			document.addEventListener( 'focus', handleOnDocumentFocus, true );
			node.addEventListener( 'mousemove', handleOnMouseMove );
			node.addEventListener( 'mouseleave', handleOnMouseLeave );
		}

		return () => {
			if ( node ) {
				document.addEventListener(
					'focus',
					handleOnDocumentFocus,
					false
				);
				node.removeEventListener( 'mousemove', handleOnMouseMove );
				node.removeEventListener( 'mouseleave', handleOnMouseLeave );
			}
		};
	}, [ ref, showMovers, setShowMovers, timeoutRef ] );

	return showMovers;
}
