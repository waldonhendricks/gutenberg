/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import { BlockToolbar } from '../';

function BlockContextualToolbar( { focusOnMount, ...props } ) {
	// TODO: Remove this work-around
	const forcedMarginNormlizedStyles = { marginLeft: 0 };
	return (
		<NavigableToolbar
			focusOnMount={ focusOnMount }
			className="block-editor-block-contextual-toolbar"
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			style={ forcedMarginNormlizedStyles }
			{ ...props }
		>
			<BlockToolbar />
		</NavigableToolbar>
	);
}

export default BlockContextualToolbar;
