<?php

/*
Plugin Name: WP picturefill
Description: Replaces <code>&lt;img&gt;</code> tags with responsive <code>&lt;picture&gt;</code> tags. Uses a <a rel="external" href="https://github.com/nwtn/picturefill">fork</a> of Scott Jehl's <a rel="external" href="https://github.com/scottjehl/picturefill">picturefill</a>.
Version: 1.0
Author: David Newton
Author URI: http://davidnewton.ca
*/


add_action('wp_enqueue_scripts', 'wppf_script');
add_filter('upload_mimes', 'wppf_upload_mimes');
add_filter('the_content', 'wppf_content');
add_filter("attachment_fields_to_edit", "wppf_svg_field_edit", null, 2);
add_filter("attachment_fields_to_save", "wppf_svg_field_save", null, 2);

if (!function_exists('get_attachment_id')) {
	/**
	 * Get the Attachment ID for a given image URL.
	 * @link   http://wordpress.stackexchange.com/a/7094
	 * @param  string $url
	 * @return boolean|integer
	 */
	function get_attachment_id($url) {
		$dir = wp_upload_dir();

		$home_url = home_url();
		if (strpos($home_url, $url) !== 0) {
			$url = trim($home_url, '/') . '/' . trim($url, '/');
		}

		$file  = basename($url);
		$query = array(
			'post_type'  => 'attachment',
			'fields'	 => 'ids',
			'meta_query' => array(
				array(
					'value'   => $file,
					'compare' => 'LIKE',
			   ),
		   )
	   );

		$query['meta_query'][0]['key'] = '_wp_attached_file';

		// query attachments
		$ids = get_posts($query);

		if (! empty($ids)) {
			foreach ($ids as $id) {
				// first entry of returned array is the URL
				if ($url === array_shift(wp_get_attachment_image_src($id, 'full')))
					return $id;
			}
		}

		$query['meta_query'][0]['key'] = '_wp_attachment_metadata';

		// query attachments again
		$ids = get_posts($query);

		if (empty($ids))
			return false;

		foreach ($ids as $id) {
			$meta = wp_get_attachment_metadata($id);
			foreach ($meta['sizes'] as $size => $values) {
				if ($values['file'] === $file && $url === array_shift(wp_get_attachment_image_src($id, $size)))
					return $id;
			}
		}

		return false;
	}
}

if (!function_exists('wppf_upload_mimes')) {
	function wppf_upload_mimes($existing_mimes=array()) {
		$existing_mimes['svg'] = 'mime/type';
		return $existing_mimes;
	}
}

if (!function_exists('wppf_svg_field_edit')) {
	/**
	 * Adding our custom fields to the $form_fields array
	 * @link http://net.tutsplus.com/tutorials/wordpress/creating-custom-fields-for-attachments-in-wordpress/
	 * @param array $form_fields
	 * @param object $post
	 * @return array
	 */
	function wppf_svg_field_edit($form_fields, $post) {
		if (substr($post->post_mime_type, 0, 5) == 'image' && $post->post_mime_type != 'image/svg+xml') {
			$form_fields["svg"] = array(
				"label" => __("SVG file URL"),
				"input" => "text", // this is default if "input" is omitted
				"value" => get_post_meta($post->ID, "_svg", true)
			);
			return $form_fields;
		}
	}
}

if (!function_exists('wppf_svg_field_save')) {
	/**
	 * @link http://net.tutsplus.com/tutorials/wordpress/creating-custom-fields-for-attachments-in-wordpress/
	 * @param array $post
	 * @param array $attachment
	 * @return array
	 */
	function wppf_svg_field_save($post, $attachment) {
		if (isset($attachment['svg'])){
			update_post_meta($post['ID'], '_svg', $attachment['svg']);
		}
		return $post;
	}
}

if (!function_exists('wppf_script')) {
	function wppf_script() {
		wp_register_script('picturefill', plugins_url( 'picturefill.pictureelement.js', __FILE__ ));
		wp_enqueue_script('picturefill');
	}
}

if (!function_exists('wppf_content')) {
	function wppf_content($content) {
		$content = preg_replace_callback('/<img[^>]+\>/i', "wppf_replace", $content);
		return $content;
	}
}

if (!function_exists('wppf_replace')) {
	function wppf_replace($matches) {
		$img = $matches[0];

		preg_match_all('/(id|class|src|alt|title)="([^"]*)"/i', $img, $matches);
		$attributes = $matches[1];
		$values = $matches[2];

		// make sure we have an image src AND that it's a WP attachment
		$src = array_search('src', $attributes);
		if ($src === false) { return $img; }
		unset($attributes[$src]);
		$src = $values[$src];
		$attachmentID = get_attachment_id($src);
		if (empty($attachmentID)) { return $img; }

		$attachment 				= wp_get_attachment_metadata($attachmentID);
		$attachment_image			= wp_get_attachment_image_src($attachmentID, 'full');
		$attachment_image_small		= wp_get_attachment_image_src($attachmentID, 'thumbnail');
		$attachment_image_medium	= wp_get_attachment_image_src($attachmentID, 'medium');
		$attachment_image_large		= wp_get_attachment_image_src($attachmentID, 'large');

		// picture tag
		$output = '
			<picture ';
		foreach ($attributes as $key => $attribute) {
			if ($values[$key] != '') {
				$output .= $attribute . '="' . $values[$key] . '"';
			}
		}
		$output .= '>';

		// svg
		$svg = get_post_meta($attachmentID, '_svg');
		if (!empty($svg) && is_array($svg)) {
			$svg = trim($svg[0]);
			if (!empty($svg)) {
				$output .= '
					<!-- If browser supports inline SVG, use image below: -->
					<!-- <source type="image/svg+xml" src="' . $svg . '"></source> -->
					<source type="image/svg+xml" src="' . $svg . '"></source>
				';
			}
		}

		// responsive raster images and fallback
		$output .= '
				<!-- Otherwise, fallback on rasters -->
				<!-- <source srcset="' . $attachment_image_medium[0] . ' 1x, ' . $attachment_image_large[0] . ' 2x"> -->
				<source srcset="' . $attachment_image_medium[0] . ' 1x, ' . $attachment_image_large[0] . ' 2x">
				<!-- <source media="(min-width: 44em)" srcset="' . $attachment_image_large[0] . ' 1x, ' . $attachment_image[0] . ' 2x"> -->
				<source media="(min-width: 44em)" srcset="' . $attachment_image_large[0] . ' 1x, ' . $attachment_image[0] . ' 2x">
				<!-- <source media="(min-width: 85em)" src="' . $attachment_image[0] . '"> -->
				<source media="(min-width: 85em)" src="' . $attachment_image[0] . '">

				<!-- Fallback content for non-JS browsers. Same img src as the initial, unqualified source element. -->
				<noscript><img src="' . $attachment_image_medium[0] . '"';
		foreach ($attributes as $key => $attribute) {
			if ($values[$key] != '') {
				$output .= $attribute . '="' . $values[$key] . '"';
			}
		}
		$output .= ' /></noscript>
			</picture>
		';

		return $output;
	}
}


?>