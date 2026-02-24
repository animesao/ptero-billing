<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', config('app.name', 'Ptero-Billing'))</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ \Illuminate\Support\Facades\Storage::disk('public')->exists('icon.png') ? asset('storage/icon.png') : asset('images/ptero-billing-icon.png') }}">

    <!-- Meta Tags -->
    <meta name="description" content="{{ config('settings::website:meta_description', 'Modern billing solution for Pterodactyl') }}">
    <meta name="keywords" content="{{ config('settings::website:meta_keywords', 'billing,pterodactyl,hosting') }}">
    <meta property="og:title" content="{{ config('app.name', 'Ptero-Billing') }}">
    <meta property="og:description" content="{{ config('settings::website:meta_description', 'Modern billing solution') }}">
    <meta property="og:image" content="{{ \Illuminate\Support\Facades\Storage::disk('public')->exists('logo.png') ? asset('storage/logo.png') : asset('images/ptero-billing-logo.png') }}">
    <meta property="og:url" content="{{ config('app.url') }}">
    <meta property="og:type" content="website">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Styles -->
    @vite(['themes/aurora/sass/app.scss'])

    @stack('styles')
</head>
<body class="hold-transition sidebar-mini layout-fixed">
<div class="wrapper">

    <!-- Navbar -->
    <nav class="main-header navbar navbar-expand navbar-light">
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="fas fa-bars"></i></a>
            </li>
        </ul>

        <ul class="navbar-nav ml-auto">
            @auth
            <li class="nav-item dropdown">
                <a class="nav-link" data-toggle="dropdown" href="#">
                    <i class="fas fa-user-circle"></i> {{ auth()->user()->name }}
                </a>
                <div class="dropdown-menu dropdown-menu-right" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius);">
                    <a href="{{ route('profile')}}" class="dropdown-item" style="color: var(--text-primary);">
                        <i class="fas fa-user mr-2"></i> {{__('Profile')}}
                    </a>
                    <a href="{{ route('logout')}}" class="dropdown-item" style="color: var(--text-primary);"
                       onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                        <i class="fas fa-sign-out-alt mr-2"></i> {{__('Log Out')}}
                    </a>
                    <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                        @csrf
                    </form>
                </div>
            </li>
            @endauth
        </ul>
    </nav>
    <!-- /.navbar -->

    <!-- Main Sidebar Container -->
    <aside class="main-sidebar sidebar-light-primary elevation-4">
        <!-- Brand Logo -->
        <a href="{{ url('/') }}" class="brand-link">
            <div class="brand-image">
                <i class="fas fa-rocket"></i>
            </div>
            <span class="brand-text font-weight-light">{{ config('app.name', 'Ptero-Billing') }}</span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Sidebar Menu -->
            <nav class="mt-4">
                <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                    <li class="nav-item">
                        <a href="{{ route('home') }}" class="nav-link {{ request()->routeIs('home') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-home"></i>
                            <p>{{__('Dashboard')}}</p>
                        </a>
                    </li>

                    @auth
                    <li class="nav-item">
                        <a href="{{ route('servers')}}" class="nav-link {{ request()->routeIs('servers.*') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-server"></i>
                            <p>{{__('Servers')}}</p>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="{{ route('store')}}" class="nav-link {{ request()->routeIs('store.*') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-shopping-cart"></i>
                            <p>{{__('Store')}}</p>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="{{ route('payment')}}" class="nav-link {{ request()->routeIs('payment.*') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-credit-card"></i>
                            <p>{{__('Payment')}}</p>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="{{ route('tickets')}}" class="nav-link {{ request()->routeIs('tickets.*') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-ticket-alt"></i>
                            <p>{{__('Support')}}</p>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="{{ route('profile')}}" class="nav-link {{ request()->routeIs('profile.*') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-user"></i>
                            <p>{{__('Profile')}}</p>
                        </a>
                    </li>
                    @endauth

                    @can('admin.access')
                    <li class="nav-header">{{__('Administration')}}</li>
                    <li class="nav-item">
                        <a href="{{ route('admin.overview') }}" class="nav-link {{ request()->routeIs('admin.overview') ? 'active' : '' }}">
                            <i class="nav-icon fas fa-tachometer-alt"></i>
                            <p>{{__('Admin Dashboard')}}</p>
                        </a>
                    </li>
                    @endcan
                </ul>
            </nav>
        </div>
    </aside>

    <!-- Content Wrapper -->
    <div class="content-wrapper">
        <!-- Content Header -->
        <div class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1 class="m-0 animate-fade-in">@yield('page-title', __('Dashboard'))</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb float-sm-right">
                            @yield('breadcrumbs')
                        </ol>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.content-header -->

        <!-- Main content -->
        <section class="content">
            <div class="container-fluid">
                @if (session('status'))
                <div class="alert alert-success alert-dismissible fade show animate-fade-in" role="alert">
                    {{ session('status') }}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                @endif

                @if (session('error'))
                <div class="alert alert-danger alert-dismissible fade show animate-fade-in" role="alert">
                    {{ session('error') }}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                @endif

                @yield('content')
            </div>
        </section>
    </div>

    <!-- Footer -->
    <footer class="main-footer">
        <div class="footer-content">
            <div>
                <strong>Copyright &copy; {{ date('Y') }} <a href="{{ url('/') }}">{{ config('app.name', 'Ptero-Billing') }}</a>.</strong>
                {{__('All rights reserved.')}}
            </div>
            <div>
                <strong>{{__('Powered by')}} <a href="https://github.com/animesao/ptero-billing" target="_blank">Ptero-Billing</a></strong>
                <span class="d-none d-md-inline"> | Version {{ config('app.version', '2.0.0') }}</span>
            </div>
        </div>
    </footer>
</div>

<!-- Scripts -->
@vite(['themes/aurora/js/app.js'])
@stack('scripts')

</body>
</html>
