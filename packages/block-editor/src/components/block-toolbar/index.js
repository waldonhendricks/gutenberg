/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import { useShowMoversGestures } from './utils';

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
	const {
		showMovers,
		gestures: showMoversGestures,
	} = useShowMoversGestures( { ref: nodeRef } );

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
		left: -1,
		position: 'absolute',
		top: -1,
		userSelect: 'none',
		zIndex: -1,
		transform: 'translateX(-48px)',
	};

	// TODO: Refactor to CSS styles
	const animatedMoverStyles = {
		backgroundColor: 'white',
		border: '1px solid black',
		borderBottomLeftRadius: 2,
		borderRight: 'none',
		borderTopLeftRadius: 2,
		transition: 'all 60ms linear',
		opacity: shouldShowMovers ? 1 : 0,
		transform: shouldShowMovers ? 'translateX(0px)' : 'translateX(100%)',
	};

	return (
		<div className={ classes }>
			<div ref={ nodeRef }>
				<div
					className="block-editor-block-toolbar__mover-trigger-container"
					style={ forcedBlockMoverWrapperStyles }
					{ ...showMoversGestures }
				>
					<div
						className="block-editor-block-toolbar__mover-trigger-wrapper"
						style={ animatedMoverStyles }
					>
						<BlockMover
							clientIds={ blockClientIds }
							__experimentalOrientation={ moverDirection }
							hideDragHandle={ hideDragHandle }
						/>
					</div>
				</div>
				{ ( shouldShowVisualToolbar || isMultiToolbar ) && (
					<div
						{ ...showMoversGestures }
						className="block-editor-block-toolbar__block-switcher-wrapper"
					>
						<BlockSwitcher clientIds={ blockClientIds } />
					</div>
				) }
			</div>
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
