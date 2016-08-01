jQuery(function ($) {

	var APP_GT = {
		replaceCartNode: function () {

			var query = Modernizr.mq('(max-width: 991px)');

			if ( query ) {
				$( '.js-cart-col' ).insertBefore( $( '.js-navbar-col' ) );
			} else {
				$( '.js-cart-col' ).insertAfter( $( '.js-navbar-col' ) );
			}

		},
		setImgOnBg: function () {

			$( '[data-img-replace]' ).each(function (index) {

				var imgSrc = $( this ).attr( 'src' );

				$( '[data-bg-img="' + index + '"]' ).css({
					backgroundImage: 'url("' + imgSrc + '")'
				});

			});

		},
		toggleSidebar: function () {

			var menu = $( '.js-sb-main' ),
					menuBg = $( '.mob-sidebar-bg' );

			if ( Modernizr.mq('(min-width: 992px)') ) {
				$( '.SIDEBAR' ).addClass( 'js-sb' ).removeClass( 'js-sb-main' );
			}

			$( '.js-sidebar-toggle' ).click(function () {
				if ( menu.hasClass( 'js-sb-visible' ) ) {
					menu.removeClass( 'js-sb-visible' );
					menuBg.removeClass( 'js-sb-bg' );
				} else {
					menu.addClass( 'js-sb-visible' );
					menuBg.addClass( 'js-sb-bg' );
				}
			});

			menuBg.click(function () {
				if ( menu.hasClass( 'js-sb-visible' ) ) {
					menu.removeClass( 'js-sb-visible' );
					menuBg.removeClass( 'js-sb-bg' );
				}
			});

		},
		init: function () {

			// cart node
			this.replaceCartNode();
			$( window ).resize( this.replaceCartNode );

			// images on background
			this.setImgOnBg();

			// sidebar toggler
			this.toggleSidebar();

			// mouseover image zoom in categories page
			$(".zoo-item").ZooMove();

		}
	};

	APP_GT.init();

});