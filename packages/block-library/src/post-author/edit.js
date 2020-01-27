/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseColors,
	withFontSizes,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockColorsStyleSelector from './block-colors-selector';

const DEFAULT_AVATAR_SIZE = 24;

function PostAuthorDisplay( { props, author, authors } ) {
	const ref = useRef();

	const { editPost } = useDispatch( 'core/editor' );

	const { fontSize } = props;
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
		ColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'background-color' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true, fontSize: fontSize.size } ],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ fontSize.size ]
	);

	const {
		id,
		firstName,
		lastName,
		name,
		showAvatar,
		showDisplayName,
		showByline,
		showBio,
		byline = __( 'Written by:' ),
	} = props.attributes;

	const hasFirstOrLastNameSet = !! firstName || !! lastName;
	const avatarSizes = [
		{ value: 24, label: __( 'Small' ) },
		{ value: 48, label: __( 'Medium' ) },
		{ value: 96, label: __( 'Large' ) },
	];

	const changeAuthor = ( authorId ) => {
		apiFetch( { path: '/wp/v2/users/' + authorId + '?context=edit' } ).then( ( newAuthor ) => {
			editPost( { author: Number( authorId ) } );
			props.setAttributes( {
				id: newAuthor.id,
				name: newAuthor.name,
				firstName: newAuthor.firstName,
				lastName: newAuthor.lastName,
				avatarSize: props.attributes.avatarSize,
				avatarUrl: newAuthor.avatar_urls[ props.attributes.avatarSize ],
				description: newAuthor.description,
			} );
		} );
	};

	const authorName = showDisplayName && hasFirstOrLastNameSet ?
		[ firstName, lastName ].join( ' ' ) :
		name;
	props.setAttributes( {
		postAuthorName: authorName,
	} );

	const blockClassNames = classnames( 'wp-block-post-author', {
		[ fontSize.class ]: fontSize.class,
	} );
	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Author Settings' ) }>
					<SelectControl
						label={ __( 'Author' ) }
						value={ id }
						options={ authors.map( ( theAuthor ) => {
							return {
								value: theAuthor.id,
								label: theAuthor.name,
							};
						} ) }
						onChange={ ( authorID ) => {
							changeAuthor( authorID );
						} }
					/>
					<ToggleControl
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () => props.setAttributes( { showAvatar: ! showAvatar } ) }
					/>
					<ToggleControl
						label={ __( 'Show display name' ) }
						checked={ showDisplayName }
						onChange={ () => props.setAttributes( { showDisplayName: ! showDisplayName } ) }
					/>
					<ToggleControl
						label={ __( 'Show byline' ) }
						checked={ showByline }
						onChange={ () => props.setAttributes( { showByline: ! showByline } ) }
					/>
					<ToggleControl
						label={ __( 'Show bio' ) }
						checked={ showBio }
						onChange={ () => props.setAttributes( { showBio: ! showBio } ) }
					/>
					{ showDisplayName && ! hasFirstOrLastNameSet &&
						<Notice status="warning" isDismissible={ false }>
							{ __( 'This author does not have their name set' ) }
						</Notice>
					}
					<hr />
					<SelectControl
						label={ __( 'Avatar size' ) }
						value={ props.attributes.avatarSize }
						options={ avatarSizes }
						onChange={ ( size ) => {
							props.setAttributes( {
								avatarSize: size,
								avatarUrl: author.avatar_urls[ size ],
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			{ InspectorControlsColorPanel }

			<BlockControls>
				<AlignmentToolbar />
				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
				>

					{ ColorPanel }

				</BlockColorsStyleSelector>
			</BlockControls>

			<TextColor>
				<BackgroundColor>

					<div
						ref={ ref }
						className={ blockClassNames }
						style={ blockInlineStyles }
					>
						{ showByline && <RichText
							className="wp-block-post-author__byline"
							multiline={ false }
							withoutInteractiveFormatting
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/strikethrough',
							] }
							value={ byline }
							onChange={ ( value ) => props.setAttributes( { byline: value } ) }
						/> }
						{ showAvatar && <div className="wp-block-post-author__avatar">
							<img
								width={ props.attributes.avatarSize }
								src={ props.attributes.avatarUrl }
								alt={ props.attributes.postAuthorName }
							/>
						</div> }
						<div className="wp-block-post-author__content">
							<p className="wp-block-post-author__name">{ props.attributes.postAuthorName }</p>
							{ showBio && <p className="wp-block-post-author__bio">{ props.attributes.description }</p> }
						</div>
					</div>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

function PostAuthorEdit( props ) {
	let [ authorId ] = useEntityProp( 'postType', 'post', 'author' );

	if ( !! props.attributes.id ) {
		authorId = props.attributes.id;
	}

	const { author, authors } = useSelect( ( select ) => {
		const {
			getEntityRecord,
			getAuthors,
		} = select( 'core' );
		return {
			author: getEntityRecord( 'root', 'user', authorId ),
			authors: getAuthors(),
		};
	}, [ authorId ] );

	if ( ! author ) {
		return 'Post Author Placeholder';
	}

	let avatarSize = DEFAULT_AVATAR_SIZE;
	if ( !! props.attributes.avatarSize ) {
		avatarSize = props.attributes.avatarSize;
	}

	const { setAttributes } = props;
	setAttributes( {
		id: Number( author.id ),
		name: author.name,
		firstName: author.first_name,
		lastName: author.last_name,
		description: author.description,
		avatarSize,
		avatarUrl: author.avatar_urls[ avatarSize ],
	} );

	return <PostAuthorDisplay props={ props } author={ author } authors={ authors } />;
}

export default withFontSizes( 'fontSize' )( PostAuthorEdit );
/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseColors,
	withFontSizes,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockColorsStyleSelector from './block-colors-selector';

const DEFAULT_AVATAR_SIZE = 24;

function PostAuthorDisplay( { props, author, authors } ) {
	const ref = useRef();

	const { editPost } = useDispatch( 'core/editor' );

	const { fontSize } = props;
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
		ColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'background-color' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true, fontSize: fontSize.size } ],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ fontSize.size ]
	);

	const {
		id,
		firstName,
		lastName,
		name,
		showAvatar,
		showDisplayName,
		showByline,
		showBio,
		byline = __( 'Written by:' ),
	} = props.attributes;

	const hasFirstOrLastNameSet = !! firstName || !! lastName;
	const avatarSizes = [
		{ value: 24, label: __( 'Small' ) },
		{ value: 48, label: __( 'Medium' ) },
		{ value: 96, label: __( 'Large' ) },
	];

	const changeAuthor = ( authorId ) => {
		apiFetch( { path: '/wp/v2/users/' + authorId + '?context=edit' } ).then( ( newAuthor ) => {
			editPost( { author: Number( authorId ) } );
			props.setAttributes( {
				id: newAuthor.id,
				name: newAuthor.name,
				firstName: newAuthor.firstName,
				lastName: newAuthor.lastName,
				avatarSize: props.attributes.avatarSize,
				avatarUrl: newAuthor.avatar_urls[ props.attributes.avatarSize ],
				description: newAuthor.description,
			} );
		} );
	};

	const authorName = showDisplayName && hasFirstOrLastNameSet ?
		[ firstName, lastName ].join( ' ' ) :
		name;
	props.setAttributes( {
		postAuthorName: authorName,
	} );

	const blockClassNames = classnames( 'wp-block-post-author', {
		[ fontSize.class ]: fontSize.class,
	} );
	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Author Settings' ) }>
					<SelectControl
						label={ __( 'Author' ) }
						value={ id }
						options={ authors.map( ( theAuthor ) => {
							return {
								value: theAuthor.id,
								label: theAuthor.name,
							};
						} ) }
						onChange={ ( authorID ) => {
							changeAuthor( authorID );
						} }
					/>
					<ToggleControl
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () => props.setAttributes( { showAvatar: ! showAvatar } ) }
					/>
					<ToggleControl
						label={ __( 'Show display name' ) }
						checked={ showDisplayName }
						onChange={ () => props.setAttributes( { showDisplayName: ! showDisplayName } ) }
					/>
					<ToggleControl
						label={ __( 'Show byline' ) }
						checked={ showByline }
						onChange={ () => props.setAttributes( { showByline: ! showByline } ) }
					/>
					<ToggleControl
						label={ __( 'Show bio' ) }
						checked={ showBio }
						onChange={ () => props.setAttributes( { showBio: ! showBio } ) }
					/>
					{ showDisplayName && ! hasFirstOrLastNameSet &&
						<Notice status="warning" isDismissible={ false }>
							{ __( 'This author does not have their name set' ) }
						</Notice>
					}
					<hr />
					<SelectControl
						label={ __( 'Avatar size' ) }
						value={ props.attributes.avatarSize }
						options={ avatarSizes }
						onChange={ ( size ) => {
							props.setAttributes( {
								avatarSize: size,
								avatarUrl: author.avatar_urls[ size ],
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			{ InspectorControlsColorPanel }

			<BlockControls>
				<AlignmentToolbar />
				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
				>

					{ ColorPanel }

				</BlockColorsStyleSelector>
			</BlockControls>

			<TextColor>
				<BackgroundColor>

					<div
						ref={ ref }
						className={ blockClassNames }
						style={ blockInlineStyles }
					>
						{ showByline && <RichText
							className="wp-block-post-author__byline"
							multiline={ false }
							withoutInteractiveFormatting
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/strikethrough',
							] }
							value={ byline }
							onChange={ ( value ) => props.setAttributes( { byline: value } ) }
						/> }
						{ showAvatar && <div className="wp-block-post-author__avatar">
							<img
								width={ props.attributes.avatarSize }
								src={ props.attributes.avatarUrl }
								alt={ props.attributes.postAuthorName }
							/>
						</div> }
						<div className="wp-block-post-author__content">
							<p className="wp-block-post-author__name">{ props.attributes.postAuthorName }</p>
							{ showBio && <p className="wp-block-post-author__bio">{ props.attributes.description }</p> }
						</div>
					</div>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

function PostAuthorEdit( props ) {
	let [ authorId ] = useEntityProp( 'postType', 'post', 'author' );

	if ( !! props.attributes.id ) {
		authorId = props.attributes.id;
	}

	const { author, authors } = useSelect( ( select ) => {
		const {
			getEntityRecord,
			getAuthors,
		} = select( 'core' );
		return {
			author: getEntityRecord( 'root', 'user', authorId ),
			authors: getAuthors(),
		};
	}, [ authorId ] );

	if ( ! author ) {
		return 'Post Author Placeholder';
	}

	let avatarSize = DEFAULT_AVATAR_SIZE;
	if ( !! props.attributes.avatarSize ) {
		avatarSize = props.attributes.avatarSize;
	}

	const { setAttributes } = props;
	setAttributes( {
		id: Number( author.id ),
		name: author.name,
		firstName: author.first_name,
		lastName: author.last_name,
		description: author.description,
		avatarSize,
		avatarUrl: author.avatar_urls[ avatarSize ],
	} );

	return <PostAuthorDisplay props={ props } author={ author } authors={ authors } />;
}

export default withFontSizes( 'fontSize' )( PostAuthorEdit );
