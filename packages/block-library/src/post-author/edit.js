/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function PostAuthorEdit( { setAttributes } ) {
	const [ authorId ] = useEntityProp( 'postType', 'post', 'author' );
	const author = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecord( 'root', 'user', authorId ),
		[ authorId ]
	);

	if ( ! author ) {
		return false;
	}

	setAttributes( {
		author,
	} );

	return (
		<>
			<BlockControls>
				<AlignmentToolbar />
			</BlockControls>
			<div className="wp-block-post-author">
				<img
					src={ author.avatar_urls[ 24 ] }
					alt={ author.name }
					className="wp-block-post-author__avatar"
				/>
				<RichText
					className="wp-block-post-author__name"
					multiline={ false }
					value={ author.name }
				/>
			</div>
		</>
	);
}
