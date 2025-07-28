'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Book, Plus, Filter, Star, MessageCircle, Eye, User, BookOpen, Brain, DollarSign, Microscope, Palette, Zap, Upload, X } from 'lucide-react';

// Configuración Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BookPlatform() {
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    difficulty: 'Principiante',
    description: '',
    tags: ''
  });

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
    loadBooks();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          profiles:uploaded_by(username, full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      console.error('Error loading books:', err);
    }
  };

  const handleBookUpload = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!formData.title || !formData.author || !formData.category) {
        throw new Error('Por favor completa los campos obligatorios');
      }

      const tagsArray = formData.tags 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const { data, error } = await supabase
        .from('books')
        .insert([
          {
            title: formData.title,
            author: formData.author,
            category_id: formData.category,
            difficulty: formData.difficulty,
            description: formData.description,
            tags: tagsArray,
            // uploaded_by se maneja automáticamente con auth
          }
        ])
        .select();

      if (error) throw error;

      // Limpiar formulario
      setFormData({
        title: '',
        author: '',
        category: '',
        difficulty: 'Principiante',
        description: '',
        tags: ''
      });

      setSuccess('¡Libro subido exitosamente!');
      
      // Recargar libros
      await loadBooks();
      
      setTimeout(() => {
        setCurrentView('browse');
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = !selectedCategory || book.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIconComponent = (iconName) => {
    const icons = {
      Brain, DollarSign, Microscope, BookOpen, Palette, Zap
    };
    return icons[iconName] || Book;
  };

  const HomeView = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Descubre, Comparte y Aprende
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          La comunidad más inteligente para intercambiar libros y conocimiento. 
          Organizado de forma que realmente puedas encontrar lo que buscas.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setCurrentView('upload')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Subir Libro
          </button>
          <button 
            onClick={() => setCurrentView('browse')}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Search size={20} />
            Explorar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{books.length}</div>
          <div className="text-gray-600">Libros Compartidos</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{categories.length}</div>
          <div className="text-gray-600">Categorías Activas</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">Beta</div>
          <div className="text-gray-600">Versión Actual</div>
        </div>
      </div>

      {/* Categorías */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Explora por Categorías</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            const categoryBooks = books.filter(book => book.category_id === category.id);
            return (
              <div 
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setCurrentView('browse');
                }}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{categoryBooks.length} libros</span>
                      <span className="text-blue-600 text-sm font-medium hover:underline">
                        Ver todos →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Libros Recientes */}
      {books.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Libros Recientes</h2>
            <button 
              onClick={() => setCurrentView('browse')}
              className="text-blue-600 hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.slice(0, 3).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const BrowseView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h1 className="text-3xl font-bold">
          {selectedCategory 
            ? `${categories.find(c => c.id === selectedCategory)?.name}` 
            : 'Explorar Libros'
          }
        </h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar libros, autores, temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Filtros de categoría */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            !selectedCategory 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas ({books.length})
        </button>
        {categories.map((category) => {
          const categoryCount = books.filter(book => book.category_id === category.id).length;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({categoryCount})
            </button>
          );
        })}
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <Book className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron libros</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory 
              ? 'Intenta con otros términos de búsqueda o explora otras categorías.'
              : 'Sé el primero en compartir un libro con la comunidad.'
            }
          </p>
          {!searchQuery && !selectedCategory && (
            <button 
              onClick={() => setCurrentView('upload')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Subir Primer Libro
            </button>
          )}
        </div>
      )}
    </div>
  );

  const UploadView = () => (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Subir Nuevo Libro</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <X size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Información Básica *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título del libro"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Autor"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({...prev, author: e.target.value}))}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <div
                  key={category.id}
                  onClick={() => setFormData(prev => ({...prev, category: category.id}))}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.category === category.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${category.color}`}>
                      <IconComponent className="text-white" size={20} />
                    </div>
                    <div>
                      <div className="font-medium">{category.name}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel
          </label>
          <div className="flex gap-3">
            {['Principiante', 'Intermedio', 'Avanzado'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData(prev => ({...prev, difficulty: level}))}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  formData.difficulty === level 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            placeholder="Descripción del libro (opcional)"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Tags separados por comas (opcional)"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleBookUpload}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={20} />
                Publicar Libro
              </>
            )}
          </button>
          <button 
            onClick={() => setCurrentView('home')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  const BookCard = ({ book }) => {
    const category = categories.find(c => c.id === book.category_id);
    const IconComponent = category ? getIconComponent(category.icon) : Book;
    const uploaderName = book.profiles?.full_name || book.profiles?.username || 'Usuario';
    
    return (
      <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
              <Book className="text-gray-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
              <p className="text-gray-600 mb-2">{book.author}</p>
              <div className="flex items-center gap-2 mb-2">
                {book.rating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-current" size={16} />
                      <span className="text-sm font-medium">{book.rating}</span>
                    </div>
                    <span className="text-gray-400">·</span>
                  </>
                )}
                <span className="text-sm text-gray-600">{book.difficulty}</span>
              </div>
              {category && (
                <div className="flex items-center gap-1 mb-2">
                  <div className={`p-1 rounded ${category.color}`}>
                    <IconComponent className="text-white" size={12} />
                  </div>
                  <span className="text-xs text-gray-500">{category.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {book.description && (
            <p className="text-gray-700 text-sm mb-4">{book.description}</p>
          )}
          
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {book.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span>{book.review_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{book.view_count || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={12} />
              </div>
              <span className="text-sm text-gray-600">{uploaderName}</span>
            </div>
            <button className="text-blue-600 hover:underline text-sm font-medium">
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Navigation = () => (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div 
              onClick={() => {
                setCurrentView('home');
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
            >
              📚 BookShare
            </div>
            <div className="hidden md:flex gap-6">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-2 rounded-md transition-colors ${currentView === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Inicio
              </button>
              <button
                onClick={() => setCurrentView('browse')}
                className={`px-3 py-2 rounded-md transition-colors ${currentView === 'browse' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Explorar
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3 py-2 rounded-md transition-colors ${currentView === 'upload' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Subir Libro
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              Beta
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' && <HomeView />}
        {currentView === 'browse' && <BrowseView />}
        {currentView === 'upload' && <UploadView />}
      </main>
    </div>
  );
}