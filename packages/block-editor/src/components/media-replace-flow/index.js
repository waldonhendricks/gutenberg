/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, createRef, renderToString } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import {
	FormFileUpload,
	NavigableMenu,
	MenuItem,
	ToolbarGroup,
	Button,
	Dropdown,
} from '@wordpress/components';
import { withDispatch, useSelect } from '@wordpress/data';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import LinkEditor from '../url-popover/link-editor';
import LinkViewer from '../url-popover/link-viewer';

const MediaReplaceFlow = ( {
	mediaURL,
	allowedTypes,
	accept,
	onSelect,
	onSelectURL,
	name = __( 'Replace' ),
	createNotice,
	removeNotice,
} ) => {
	const [ showURLInput, setShowURLInput ] = useState( false );
	const [ showEditURLInput, setShowEditURLInput ] = useState( false );
	const [ mediaURLValue, setMediaURLValue ] = useState( mediaURL );
	const mediaUpload = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings().mediaUpload;
	}, [] );
	const editMediaButtonRef = createRef();
	const errorNoticeID = uniqueId();

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const stopPropagationRelevantKeys = ( event ) => {
		if (
			[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf(
				event.keyCode
			) > -1
		) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	const onError = ( message ) => {
		createNotice( 'error', renderToString( message ), {
			speak: true,
			id: errorNoticeID,
			isDismissible: true,
			__unstableHTML: true,
		} );
	};

	const selectMedia = ( media ) => {
		onSelect( media );
		setMediaURLValue( media.url );
		speak( __( 'The media file has been replaced' ) );
		removeNotice( errorNoticeID );
	};

	const selectURL = ( newURL ) => {
		onSelectURL( newURL );
		setShowEditURLInput( false );
	};

	const uploadFiles = ( event, closeDropdown ) => {
		const files = event.target.files;
		const setMedia = ( [ media ] ) => {
			selectMedia( media );
			closeDropdown();
		};
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	};

	const openOnArrowDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			event.target.click();
		}
	};

	let urlInputUIContent;
	if ( showEditURLInput ) {
		urlInputUIContent = (
			<LinkEditor
				onKeyDown={ stopPropagationRelevantKeys }
				onKeyPress={ stopPropagation }
				value={ mediaURLValue }
				isFullWidthInput={ true }
				hasInputBorder={ true }
				onChangeInputValue={ ( url ) => setMediaURLValue( url ) }
				onSubmit={ ( event ) => {
					event.preventDefault();
					selectURL( mediaURLValue );
					editMediaButtonRef.current.focus();
				} }
			/>
		);
	} else {
		urlInputUIContent = (
			<LinkViewer
				isFullWidth={ true }
				className="block-editor-media-replace-flow__link-viewer"
				url={ mediaURLValue }
				onEditLinkClick={ () =>
					setShowEditURLInput( ! showEditURLInput )
				}
			/>
		);
	}

	return (
		<Dropdown
			contentClassName="block-editor-media-replace-flow__options"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarGroup className="media-replace-flow">
					<Button
						ref={ editMediaButtonRef }
						aria-expanded={ isOpen }
						onClick={ onToggle }
						onKeyDown={ openOnArrowDown }
					>
						{ name }
						<span className="block-editor-media-replace-flow__indicator" />
					</Button>
				</ToolbarGroup>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<NavigableMenu>
						<MediaUpload
							onSelect={ ( media ) => selectMedia( media ) }
							allowedTypes={ allowedTypes }
							render={ ( { open } ) => (
								<MenuItem icon="admin-media" onClick={ open }>
									{ __( 'Open Media Library' ) }
								</MenuItem>
							) }
						/>
						<MediaUploadCheck>
							<FormFileUpload
								onChange={ ( event ) => {
									uploadFiles( event, onClose );
								} }
								accept={ accept }
								render={ ( { openFileDialog } ) => {
									return (
										<MenuItem
											icon="upload"
											onClick={ () => {
												openFileDialog();
											} }
										>
											{ __( 'Upload' ) }
										</MenuItem>
									);
								} }
							/>
						</MediaUploadCheck>
						{ onSelectURL && (
							<MenuItem
								icon="admin-links"
								onClick={ () =>
									setShowURLInput( ! showURLInput )
								}
								aria-expanded={ showURLInput }
							>
								<div> { __( 'Insert from URL' ) } </div>
							</MenuItem>
						) }
					</NavigableMenu>
					{ showURLInput && (
						<div className="block-editor-media-flow__url-input">
							{ urlInputUIContent }
						</div>
					) }
				</>
			) }
		/>
	);
};

export default compose( [
	withDispatch( ( dispatch ) => {
		const { createNotice, removeNotice } = dispatch( 'core/notices' );
		return {
			createNotice,
			removeNotice,
		};
	} ),
] )( MediaReplaceFlow );