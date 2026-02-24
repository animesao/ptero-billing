<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{__('Login')}} - {{ config('app.name', 'Ptero-Billing') }}</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ \Illuminate\Support\Facades\Storage::disk('public')->exists('icon.png') ? asset('storage/icon.png') : asset('images/ptero-billing-icon.png') }}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Styles -->
    <style>
        :root {
            --aurora-gradient: linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%);
            --sunset-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --bg-card: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
            --border-radius: 24px;
            --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
            --shadow-glow: 0 0 30px rgba(0, 201, 255, 0.2);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Poppins', sans-serif;
            background: var(--bg-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }

        /* Aurora Background Effect */
        body::before {
            content: '';
            position: absolute;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(0, 201, 255, 0.08) 0%, transparent 70%);
            top: -300px;
            left: -200px;
            animation: aurora 15s ease infinite;
        }

        body::after {
            content: '';
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(146, 254, 157, 0.08) 0%, transparent 70%);
            bottom: -250px;
            right: -200px;
            animation: aurora 18s ease infinite reverse;
        }

        @keyframes aurora {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
            50% { transform: translate(50px, 50px) scale(1.2); opacity: 0.8; }
        }

        .login-container {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 480px;
        }

        .login-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 3.5rem;
            box-shadow: var(--shadow-lg), var(--shadow-glow);
            animation: fadeIn 0.8s ease forwards;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(50px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .logo-container {
            text-align: center;
            margin-bottom: 2.5rem;
        }

        .logo {
            width: 90px;
            height: 90px;
            margin: 0 auto 1.5rem;
            background: var(--aurora-gradient);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.75rem;
            color: var(--text-primary);
            box-shadow: 0 8px 25px rgba(0, 201, 255, 0.3);
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .logo-text {
            font-size: 1.875rem;
            font-weight: 800;
            background: var(--aurora-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            color: var(--text-secondary);
            margin-top: 0.75rem;
            font-size: 1rem;
            font-weight: 400;
        }

        .form-group {
            margin-bottom: 1.75rem;
        }

        .form-label {
            display: block;
            color: var(--text-primary);
            font-weight: 600;
            margin-bottom: 0.875rem;
            font-size: 1rem;
        }

        .form-input {
            width: 100%;
            padding: 1.125rem 1.375rem;
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 16px;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
        }

        .form-input:focus {
            outline: none;
            border-color: #00c9ff;
            background: var(--bg-secondary);
            box-shadow: 0 0 0 5px rgba(0, 201, 255, 0.1);
            transform: translateY(-2px);
        }

        .form-input::placeholder {
            color: var(--text-secondary);
            opacity: 0.6;
        }

        .btn-primary {
            width: 100%;
            padding: 1.125rem;
            background: var(--aurora-gradient);
            border: none;
            border-radius: 16px;
            color: var(--text-primary);
            font-size: 1.0625rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-primary::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.6s ease;
        }

        .btn-primary:hover::before {
            left: 100%;
        }

        .btn-primary:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 30px rgba(0, 201, 255, 0.4);
        }

        .btn-primary:active {
            transform: translateY(-2px);
        }

        .divider {
            display: flex;
            align-items: center;
            margin: 2.5rem 0;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--border-color), transparent);
        }

        .divider span {
            padding: 0 1.25rem;
            font-size: 0.9375rem;
        }

        .social-login {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
        }

        .btn-social {
            padding: 1rem;
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 16px;
            color: var(--text-primary);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            text-decoration: none;
            font-size: 0.9375rem;
        }

        .btn-social:hover {
            background: var(--bg-secondary);
            border-color: #00c9ff;
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 201, 255, 0.2);
        }

        .links {
            text-align: center;
            margin-top: 2.25rem;
            color: var(--text-secondary);
            font-size: 0.9375rem;
            font-weight: 500;
        }

        .links a {
            color: #00c9ff;
            text-decoration: none;
            font-weight: 700;
            transition: all 0.3s ease;
            position: relative;
        }

        .links a::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--aurora-gradient);
            transition: width 0.3s ease;
        }

        .links a:hover::after {
            width: 100%;
        }

        .links a:hover {
            color: #92fe9d;
        }

        .alert {
            padding: 1.125rem 1.375rem;
            border-radius: 16px;
            margin-bottom: 1.5rem;
            animation: slideDown 0.5s ease forwards;
            font-weight: 500;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-25px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .alert-success {
            background: linear-gradient(135deg, rgba(0, 201, 255, 0.15) 0%, rgba(146, 254, 157, 0.15) 100%);
            border-left: 5px solid #00c9ff;
            color: var(--text-primary);
        }

        .alert-danger {
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.15) 0%, rgba(245, 87, 108, 0.15) 100%);
            border-left: 5px solid #f5576c;
            color: var(--text-primary);
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            margin-bottom: 1.75rem;
        }

        .checkbox-input {
            width: 22px;
            height: 22px;
            cursor: pointer;
            accent-color: #00c9ff;
            border-radius: 6px;
        }

        .checkbox-label {
            color: var(--text-secondary);
            font-size: 0.9375rem;
            cursor: pointer;
            font-weight: 500;
        }

        /* Input icons */
        .input-wrapper {
            position: relative;
        }

        .input-icon {
            position: absolute;
            right: 1.25rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            opacity: 0.5;
            pointer-events: none;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .login-card {
                padding: 2.5rem 1.75rem;
            }

            .social-login {
                grid-template-columns: 1fr;
            }

            .logo {
                width: 70px;
                height: 70px;
                font-size: 2.25rem;
            }

            .logo-text {
                font-size: 1.5rem;
            }
        }
    </style>

    @stack('styles')
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="logo-container">
                <div class="logo">
                    <i class="fas fa-rocket"></i>
                </div>
                <h1 class="logo-text">{{ config('app.name', 'Ptero-Billing') }}</h1>
                <p class="subtitle">{{__('Welcome back! Please login to continue.')}}</p>
            </div>

            @if (session('status'))
            <div class="alert alert-success">
                {{ session('status') }}
            </div>
            @endif

            @if (session('error'))
            <div class="alert alert-danger">
                {{ session('error') }}
            </div>
            @endif

            <form method="POST" action="{{ route('login') }}">
                @csrf

                <div class="form-group">
                    <label class="form-label" for="email">{{__('Email Address')}}</label>
                    <div class="input-wrapper">
                        <input
                            type="email"
                            class="form-input"
                            id="email"
                            name="email"
                            placeholder="your@email.com"
                            value="{{ old('email') }}"
                            required
                            autofocus
                        >
                        <i class="fas fa-envelope input-icon"></i>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">{{__('Password')}}</label>
                    <div class="input-wrapper">
                        <input
                            type="password"
                            class="form-input"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                        >
                        <i class="fas fa-lock input-icon"></i>
                    </div>
                </div>

                <div class="checkbox-group">
                    <input
                        type="checkbox"
                        class="checkbox-input"
                        id="remember"
                        name="remember"
                    >
                    <label class="checkbox-label" for="remember">{{__('Remember Me')}}</label>
                </div>

                <button type="submit" class="btn-primary">
                    {{__('Sign In')}}
                </button>
            </form>

            @if(config('auth.socialite.discord.enabled', false))
            <div class="divider">
                <span>{{__('or continue with')}}</span>
            </div>

            <div class="social-login">
                <a href="{{ route('auth.redirect', 'discord') }}" class="btn-social">
                    <i class="fab fa-discord"></i>
                    Discord
                </a>
            </div>
            @endif

            <div class="links">
                <p>
                    {{__("Don't have an account?")}}
                    <a href="{{ route('register') }}">{{__('Register here')}}</a>
                </p>
                <p style="margin-top: 0.875rem;">
                    <a href="{{ route('password.request') }}">{{__('Forgot your password?')}}</a>
                </p>
            </div>
        </div>
    </div>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    @stack('scripts')
</body>
</html>
