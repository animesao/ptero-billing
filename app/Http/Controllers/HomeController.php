<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Server;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index()
    {
        $products = Product::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return view('home', compact('products'));
    }

    public function products()
    {
        $products = Product::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return view('products.index', compact('products'));
    }

    public function product(Product $product)
    {
        if (!$product->is_active) {
            abort(404);
        }

        return view('products.show', compact('product'));
    }
}
