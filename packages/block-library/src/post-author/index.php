<?php
/**
 * Server-side rendering of the `core/post-author` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-author` block on the server.
 *
 * @return string Returns the filtered post author for the current post wrapped inside "h6" tags.
 */
function render_block_core_post_author() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}

	$avatar = get_avatar(
		$post->post_author,
		24,
		'',
		'',
		array(
			'class' => 'wp-block-post-author__avatar',
		)
	);

	// translators: %s: The author.
	return '<address>' .
		$avatar .
		get_the_author() .
	'</address>';
}

/**
 * Registers the `core/post-author` block on the server.
 */
function register_block_core_post_author() {
	register_block_type(
		'core/post-author',
		array(
			'render_callback' => 'render_block_core_post_author',
		)
	);
}
add_action( 'init', 'register_block_core_post_author' );
