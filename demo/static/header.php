<!DOCTYPE html>
<!--[if lt IE 7]><html class="no-js lt-ie9 lt-ie8 lt-ie7" lang="<?php echo $lang; ?>"><![endif]-->
<!--[if IE 7]><html class="no-js lt-ie9 lt-ie8" lang="<?php echo $lang; ?>"><![endif]-->
<!--[if IE 8]><html class="no-js lt-ie9" lang="<?php echo $lang; ?>"><![endif]-->
<!--[if gt IE 8]><!--><html class="no-js" lang="<?php echo $lang; ?>"><!--<![endif]-->
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<link rel="shortcut icon" href="favicon.ico" />
	<title><?php echo $title; ?></title>
	
<?php if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest'): ?>
	<script>
		// Change .no-js to .js on <html>
		var h = document.documentElement;
		h.className = h.className.substring(3);
	</script>
	
	<link rel="shortcut icon" href="favicon.ico" />
	
	<script src="static/js/min/modernizr.js"></script>
	<link rel="stylesheet" href="static/css/main.css" media="all" />
	<!--[if lt IE 9]><link rel="stylesheet" href="static/css/960-main.css" media="all" /><![endif]-->
<?php endif; ?>
</head>
<body class="<?php echo $body_class; ?>">
<?php if ($body_class === 'question-page'): ?>
	<div id="toolbar" class="is-muted">
<?php else: ?>
	<div id="toolbar">
<?php endif; ?>
		<header id="masthead">
<?php if ($body_class === 'cards-page' || $body_class === 'completion-page'): ?>
			<a href="launch.php" class="btn back-btn">Back to Deck</a>
<?php elseif ($body_class === 'question-page'): ?>
			<a href="launch.php" class="btn back-btn cancel-btn">Back to Deck</a>
<?php endif; ?>
			<h1 id="main-branding"><a href="index.php" class="logotype">Sleepless</a></h1>
<?php if ($body_class !== 'question-page'): ?>
			<form method="get" action="search.php" class="combo-field page-transition-form" id="search">
				<input type="submit" name="search-submit" value="Search Decks" class="btn combo-field-btn" />
				<span class="combo-field-wrap"><input type="text" name="search" class="combo-field-text" /></span>
			</form>
<?php endif; ?>
		</header>
	</div>
	<div id="wrap">