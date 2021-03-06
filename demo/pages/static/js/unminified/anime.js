var anime = (function($) {
	var canTransition = Modernizr.csstransitions,
		threshold = 20, // Maximum number of elements to animate
		win = $(window),
		
		/**
		* Ensures that the duration will be an object with a css and jquery property.
		*/
		normalizeDuration = function(duration) {
			if (typeof duration !== 'object') {
				duration = {
					css: duration,
					jquery: duration
				}
			}
			
			return duration;
		},
		
		/**
		* Restores the original CSS positioning of the elements.
		*/
		restorePositioning = function(elements) {
			// Remove the element placeholders
			var elementsClone = elements.clone().not('.animation-space-placeholder');
			
			// Restore positioning
			elementsClone.css({
				position: $(elements[0]).data('position'),
				zIndex: 'auto'
			});
			
			// Replace the elements in the DOM with our new element (single reflow)
			elements.replaceWith(elementsClone);
		}
		
		/**
		* Offsets an element to a specific position relative to its parent, and stores its origin position in the element.
		* @param element The element.
		* @param position Either an object specifying the top and bottom, or a function that returns such an object.
		*/
		offsetElement = function(element, position) {
			// Create a clone for working with in memory
			var elementClone = element.clone(),
				offset = element.position(),
				temp,
				left,
				top;
			
			// Store this to restore it later
			elementClone.data('position', element.css('position'));
			
			// Store the element's original position for later
			elementClone.data('top', offset.top);
			elementClone.data('left', offset.left);
			
			// Get the position to set it at
			if (typeof position === 'function') {
				temp = position({
					element: childClone,
					offset: childOffset
				});
				
				top  = temp.top;
				left = temp.left;
			} else {
				top  = position.top;
				left = position.left;
			}
			
			// Create a placeholder element to hold the space previously occupied by this element
			elementClone.clone().insertAfter(elementClone).css('visbility', 'hidden').addClass('animation-space-placeholder');
			
			elementClone.css({
				position: 'absolute', // position: absolute; must be set here, or else .position() will not work a few lines up from this one
				top: top,
				left: left,
				visibility: 'visible'
			});
			
			// Replace the element in the DOM with our new element (single reflow)
			element.replaceWith(elementClone);
			
			// Return the updated DOM element
			return elementClone;
		}
		
		/**
		* Offsets all children to a specific position relative to their parent, and stores their origin positions in the element.
		* @param parent The parent element.
		* @param position Either an object specifying the top and bottom, or a function that returns such an object.
		*/
		offsetChildren = function(parent, position) {
			var children = parent.children(), // We're animating its children
				
				// Create a clone for working with in memory
				parentClone = parent.clone(),
				childrenClone = parentClone.children();
			
			// Store this to restore it later
			$(childrenClone[0]).data('position', $(children[0]).css('position'));
			
			// Set the intial animation position on each element in memory
			childrenClone.each(function(i, childClone) {
				// Respect the threshold
				if (i === threshold) { return false; }
				
				childClone = $(childClone);
				
				var childOffset = $(children[i]).position(),
					temp,
					left,
					top;
				
				// Store the element's original position for later
				childClone.data('top', childOffset.top);
				childClone.data('left', childOffset.left);
				
				// Get the position to set it at
				if (typeof position === 'function') {
					temp = position({
						index: i,
						element: childClone,
						offset: childOffset
					});
					
					top  = temp.top;
					left = temp.left;
				} else {
					top  = position.top;
					left = position.left;
				}
				
				// Create a placeholder element to hold the space previously occupied by this element (the placeholder has its id removed)
				childClone.clone().insertAfter(childClone).css('visbility', 'hidden').addClass('animation-space-placeholder').attr('id', '');
				
				childClone.css({
					position: 'absolute', // position: absolute; must be set here, or else .position() will not work a few lines up from this one
					top: top,
					left: left,
					zIndex: 10001
				});
			});
			
			childrenClone.css('visibility', 'visible');
			
			// Replace the element in the DOM with our new element (single reflow)
			parent.replaceWith(parentClone);
			
			// Return the updated DOM element
			return parentClone;
		},
		
		/**
		* Runs the animation using CSS transitions if possible, or a jQuery .animate fallback
		* @param element The element to animate.
		* @param duration Either an integer or an object with css and jquery keys.
		* @param callback A function to call after the animation finishes.
		*/
		runAnimationOnElement = function(element, duration, callback) {
			// If the animation doesn't have a no-defer classs...
			if (!element.hasClass('animate-no-defer')) {
				element.addClass('animate-no-defer'); // Add the no-defer class
				
				// ...wait until the element scrolls into view to animate it
				element.on('inview', function (event, visible) {
					element.off('inview');
					
					if (visible === true) {
						runAnimationOnElement($(this), duration, callback);
					}
				});
				
				// And do nothing from this point on
				return;
			}
			
			duration = normalizeDuration(duration);
			
			if (canTransition) {
				// A slight delay is necessary for the CSS transition to trigger
				setTimeout(function() {
					// Set the element back to its original position
					element.css({
						top:  element.data('top'),
						left: element.data('left')
					});
				}, 10);
				
				// Clean up after ourselves once the animation has finished
				setTimeout(function() {
					if (typeof callback !== 'undefined') {
						callback(element);
					}
					
					restorePositioning(element);
				}, duration.css+10);
			} else {
				// jQuery .animate fallback for browsers that don't support CSS transitions
				
				// Set the element back to its original position
				element.animate({
					top: element.data('top'),
					left: element.data('left')
				}, {
					queue: false,
					duration: duration.jquery,
					complete: function() {
						// Clean up after ourselves once the animation has finished
						if (typeof callback !== 'undefined') {
							callback(element);
						}
					}
				});
				
				setTimeout(function() {
					restorePositioning(element);
				}, duration.jquery);
			}
		},
		
		/**
		* Runs the animation using CSS transitions if possible, or a jQuery .animate fallback
		* @param element The parent element.
		* @param duration Either an integer or an object with css and jquery keys.
		* @param callback A function to call after the animation finishes. The child element passed to it will either be an element or a collection of elements depending on whether we fell back on jQuery's animation.
		*/
		runAnimationOnChildren = function(element, duration, callback) {
			var children;
			
			// If the animation doesn't have a no-defer classs...
			if (!element.hasClass('animate-no-defer')) {
				element.addClass('animate-no-defer'); // Add the no-defer class
				
				// ...wait until the element scrolls into view to animate it
				element.on('inview', function (event, visible) {
					element.off('inview');
					
					if (visible === true) {
						runAnimationOnChildren($(this), duration, callback);
					}
				});
				
				// And do nothing from this point on
				return;
			}
			
			// Get the elements under the threshold (threshold*2 will include the placeholders in our query)
			children = element.children().slice(0, threshold*2);
			
			duration = normalizeDuration(duration);
			
			if (canTransition) {
				// A slight delay is necessary for the CSS transition to trigger
				setTimeout(function() {
					children.each(function(i, child) {
						child = $(child);
						
						// Set the element back to its original position
						child.css({
							top:  child.data('top'),
							left: child.data('left')
						});
					});
				}, 10);
				
				// Clean up after ourselves once the animation has finished
				setTimeout(function() {
					if (typeof callback !== 'undefined') {
						callback(element, children);
					}
					
					restorePositioning(children);
				}, duration.css+10);
			} else {
				// jQuery .animate fallback for browsers that don't support CSS transitions
				children.each(function(i, child) {
					child = $(child);
					
					// Set the element back to its original position
					child.animate({
						top: child.data('top'),
						left: child.data('left')
					}, {
						queue: false,
						duration: duration.jquery,
						complete: function() {
							// Clean up after ourselves once the animation has finished
							if (typeof callback !== 'undefined') {
								callback(element, $(this));
							}
						}
					});
					
					setTimeout(function() {
						restorePositioning(children);
					}, duration.jquery);
				});
			}
		},
		
		
		
		
		
		/**
		* Transitions the page content out to make way for dynamically loaded content.
		* @TODO Handle muting the menubar
		* @TODO We could do a better job of handling all these arguments
		*
		* @TODO This is a horrible, horrible mess and provides a shoddy user experience
		*/
		transitionPageTo = function(newMain, newMenubar, newFooter, newScripts, data) {
			body = $(document.body),
			
			main       = body.find('#wrap'),
			mainOffset = main.offset(),
			
			menubar = body.find('#toolbar'),
			
			oldHeight = main.height(),
			temp = newMain.clone().hide().appendTo(body), // Used to get the new height
			newHeight = temp.height(),
			
			backButton         = menubar.find('.back-btn'),
			newBackButton      = newMenubar.find('.back-btn'),
			hasBackButtonNow   = backButton.length,
			willHaveBackButton = newBackButton.length,
			
			searchForm    = menubar.find('#search'),
			newSearchForm = newMenubar.find('#search'),
			
			footer = body.find('#footer'),
			
			duration = {
				css: 750,
				jquery: 750
			};
			
			// @TODO Scroll to page top?
			// @TODO On some pages (like the cards page), the footer winds up halfway down the page
			
			body.find('#old-wrap, script').remove(); // Remove any possible remnants of an old transition and old scripts
			temp.remove();
			
			// Fade out and set the new page to the height of the original page
			newMain.css({
				height: oldHeight,
				opacity: 0
			}).data('original-positioning', newMain.css('position'));
			
			// Remove the old page from the flow and change its id
			main.css({
				position: 'absolute',
				left: mainOffset.left // @TODO This offset messes things up when leaving the study page
			}).attr('id', 'old-wrap');
			
			// Insert our new page before we animate
			newMain.insertAfter(main);
			
			// Load the new scripts for this page
			body.append(newScripts);
			
			if (canTransition) {
				// A slight delay is necessary for the CSS transition to trigger
				setTimeout(function() {
					// Fade the old page out
					main.css('opacity', 0);
					
					// Animate the new page as it comes in
					runAnimations();
					$(window).scroll(); // Trigger scroll events for the new page
					
					// Fade the new page in and smoothly adjust the page height
					newMain.css({
						opacity: 1,
						height: newHeight
					});
				}, 10);
				
				// Clean up after ourselves once the animation has finished
				setTimeout(function() {
					main.remove();
					newMain.css({
						position: newMain.data('original-positioning'),
						height: 'auto'
					});
				}, duration.css+10);
			} else {
				// jQuery .animate fallback for browsers that don't support CSS transitions
				
				// Fade the old page out
				main.animate({
					opacity: 0
				}, {
					queue: false,
					duration: duration.jquery,
					complete: function() {
						$(this).remove();
					}
				});
				
				// Animate the new page as it comes in
				$(window).scroll(); // Trigger scroll events for the new page
				runAnimations();
				
				// Fade the new page in and smoothly adjust the page height
				newMain.animate({
					opacity: 1,
					height: newHeight
				}, {
					queue: false,
					duration: duration.jquery,
					complete: function() {
						var that = $(this);
						
						that.css({
							position: that.data('original-positioning'),
							height: 'auto'
						});
					}
				});
			}
			
			// Update the classes on the menubar
			menubar.attr('class', newMenubar.attr('class'));
			
			// Animate any changes to the menubar's back button
			if (hasBackButtonNow || willHaveBackButton) {
				// @TODO If the buttons look the same, we should just swap them out with no animation
				
				// Remove the current button, if it exists
				if (hasBackButtonNow) {
					removeBackButton(backButton);
				}
				
				if (willHaveBackButton) {
					addBackButton(newBackButton);
				}
			}
			
			// Animate any changes to the menubar's search form
			if (searchForm.length !== newSearchForm.length) {
				if (searchForm.length) {
					hideSearchForm();
				} else {
					showSearchForm(newSearchForm);
				}
			}
			
			// Animate any changes to the footer
			if (footer.length !== newFooter.length) {
				if (footer.length) {
					hideFooter();
				} else {
					showFooter(newFooter);
				}
			}
			
			// Handle the home page
			if (body.hasClass('home-page')) {
				hideMural();
			} else if (data.home) {
				showMural();
			}
		},
		
		
		
		/**
		* Animates the background image up until it's off the page.
		*/
		hideMural = function() {
			var body = $(document.body),
				duration = {
					css: 1000,
					jquery: 1000
				};
			
			if (canTransition) {
				// @TODO getTransitionDuration method
				// A slight delay is necessary for the CSS transition to trigger
				setTimeout(function() {
					body.css('background-position', 'center -500px');
				}, 10);
				
				// Clean up after ourselves once the animation has finished
				setTimeout(function() {
					body.removeClass('home-page');
				}, duration.css+10);
			} else {
				// jQuery .animate fallback for browsers that don't support CSS transitions
				body.animate({
					backgroundPositionY: '-500px'
				}, {
					queue: false,
					duration: duration.jquery,
					complete: function() {
						$(this).removeClass('home-page');
					}
				});
			}
		},
		
		
		
		/**
		* Animates the background image down until it's on the page.
		*/
		showMural = function() {
			// @TODO This animation is broken in FF when coming back from a non pushed-state page
			var body = $(document.body),
				duration = {
					css: 1000,
					jquery: 1000
				};
			
			// This doesn't animate properly on pages that weren't brought in via AJAX if we don't disable transitions temporarily
			body.addClass('home-page no-transition').css('background-position', 'center -500px');
			
			if (canTransition) {
				// A slight delay is necessary for the CSS transition to trigger
				setTimeout(function() {
					body.removeClass('no-transition').css('background-position', 'center 0');
				}, 10);
			} else {
				// jQuery .animate fallback for browsers that don't support CSS transitions
				body.animate({
					backgroundPositionY: 0
				}, {
					queue: false,
					duration: duration.jquery
				});
			}
		},
		
		
		
		/**
		* Animates the search form out on the menubar.
		*/
		hideSearchForm = function() {
			var search = $('#search');
			
			search.remove();
		},
		
		/**
		* Animates the search form out on the menubar.
		*/
		showSearchForm = function(searchForm) {
			var masthead = $('#masthead');
			
			masthead.append(searchForm);
		},
		
		
		
		/**
		* Animates a back button out on the menubar.
		*/
		removeBackButton = function(button) {
			button.remove();
		},
		
		/**
		* Animates a back button in on the menubar.
		*/
		addBackButton = function(button) {
			var masthead = $('#masthead');
			
			masthead.prepend(button);
		},
		
		
		
		/**
		* Animates the footer out.
		*/
		hideFooter = function() {
			var footer = $('#footer');
			
			footer.remove();
		},
		
		/**
		* Animates the footer in.
		*/
		showFooter = function(newFooter) {
			var body = $(document.body);
			
			body.append(newFooter);
		},
		
		
		
		
		
		/**
		* Slides in each child element alternatively between left and right.
		*/
		zipperSlide = function(parent, duration) {
			// Store dimensions we'll need for calculations
			var parentWidth = parent.width(),
				parentPadding = parseInt(parent.css('padding-left'), 10) * 2,
				oddOffset = -parentWidth-parentPadding,
				evenOffset = parentWidth+parentPadding,
				children = parent.children();
			
			// Prevent scrollbars and get the height to prevent the parent from collapsing
			parent.css('overflow', 'hidden').css('height', parent.height());
			children.css('max-width', $(children[0]).width());
			
			// Offset the children and get the updated DOM element
			parent = offsetChildren(parent, function(child) {
				// Position the element off to the left or right
				var pos = {
					top:  child.offset.top,
					left: oddOffset
				};
				
				if (child.index%2 !== 0) { // even children
					pos.left = evenOffset;
				}
				
				return pos;
			});
			
			// Animate the elements
			runAnimationOnChildren(parent, duration, function(element, child) {
				element.css('overflow', 'auto');
				element.css('height', 'auto');
				
				child.css({
					maxWidth: 'none'
				});
			});
		},
		
		
		
		/**
		* Slides the left column in from the bottom left, and the right column from the bottom right.
		*/
		cornerSlide = function(parent, duration) {
			// Store dimensions we'll need for calculations
			var leftParentOffset = parent.position().left,
				topOffset = $(window).height() + $(document).scrollTop();
			
			// Get the height to prevent the parent from collapsing
			parent.css('height', parent.height());
			
			// Offset the children and get the updated DOM element
			parent = offsetChildren(parent, function(child) {
				// Position the element at the bottom left or right of the window
				var pos = {
					top:  topOffset,
					left: -leftParentOffset
				};
				
				if (child.index%2 !== 0) { // event children
					pos.left = child.offset.left + leftParentOffset;
				}
				
				return pos;
			});
			
			// Animate the elements
			runAnimationOnChildren(parent, duration, function(element, child) {
				element.css('height', 'auto');
			});
		},
		
		
		
		/**
		* Slides the element in from the left.
		*/
			slideFromLeft = function(element, duration) {
			// @TODO Things are all messed up for this in different browsers
			element = offsetElement(element, {
				top:  element.position().top,
				left: -element.width()
			});
			
			// Animate the elements
			runAnimationOnElement(element, duration);
		},
		
		
		
		
		
		runAnimations = function() {
			var animeQueue = $('#wrap').find('.animate');
			
			// For each element in the animation queue
			animeQueue.each(function(i, animeElement) {
				animeElement = $(animeElement);
				
				// Two column grid animation
				if (animeElement.hasClass('two-col')) {
					if (win.width()> 959) {
						cornerSlide(animeElement, {
							css: 1000,
							jquery: 850
						});
					} else {
						zipperSlide(animeElement, {
							css: 500,
							jquery: 350
						});
					}
				} else if (animeElement.hasClass('sidebar')) {
					slideFromLeft(animeElement, {
						css: 750,
						jquery: 750
					});
				}
			});
		};
	
	
	
	runAnimations();
	
	return {
		transitionPageTo: transitionPageTo,
		showMural:        showMural
	}
}(jQuery));