'use client';
import React, { useEffect, useState, useRef } from 'react';
import { assets } from '@/assets/assets';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import Footer from '@/components/seller/Footer';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';
import axios from 'axios';

const ProductList = () => {
  const { router, getToken, user, isSeller } = useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    offerPrice: '',
    category: '',
    description: '',  // added description here
  });
  const [updating, setUpdating] = useState(false);

  const pendingDeleteTimers = useRef({});

  useEffect(() => {
    if (!isSeller) router.replace('/');
  }, [isSeller, router]);

  const fetchSellerProduct = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/product/seller-list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success) {
        setProducts(data.products);
      } else {
        toast.error(data?.error || 'Failed to fetch products');
      }
    } catch (error) {
      toast.error(error?.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSellerProduct();
  }, [user]);

  const handleDeleteProduct = async (id) => {
    const token = await getToken();
    const deletedProduct = products.find((p) => p._id === id);
    if (!deletedProduct) return;

    setProducts((prev) => prev.filter((p) => p._id !== id));

    const toastId = toast(
      (t) => (
        <span>
          Product deleted.
          <button
            className="ml-2 underline"
            onClick={() => {
              clearTimeout(pendingDeleteTimers.current[id]);
              delete pendingDeleteTimers.current[id];
              setProducts((prev) => [deletedProduct, ...prev]);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </span>
      ),
      { duration: 4000 }
    );

    const timerId = setTimeout(async () => {
      try {
        await axios.delete(`/api/product/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        toast.error('Failed to delete product from server.');
        fetchSellerProduct();
      }
      delete pendingDeleteTimers.current[id];
      toast.dismiss(toastId);
    }, 4000);

    pendingDeleteTimers.current[id] = timerId;
  };

  const handleBulkDelete = () => {
    setShowModal(true);
  };

  const confirmBulkDelete = async () => {
    const token = await getToken();
    const toDelete = products.filter((p) => selectedProducts.includes(p._id));
    setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p._id)));
    setShowModal(false);

    for (const product of toDelete) {
      await axios.delete(`/api/product/delete/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    toast.success(`${toDelete.length} product(s) deleted`);
    setSelectedProducts([]);
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const startEditing = (product) => {
    setEditingProductId(product._id);
    setEditForm({
      name: product.name,
      price: product.price || '',
      offerPrice: product.offerPrice || '',
      category: product.category,
      description: product.description || '',  // populate description
    });
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditForm({
      name: '',
      price: '',
      offerPrice: '',
      category: '',
      description: '',  // reset description
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveUpdate = async () => {
    if (!editingProductId) return;

    setUpdating(true);
    try {
      const token = await getToken();

      const payload = {
        name: editForm.name,
        price: Number(editForm.price),
        offerPrice: Number(editForm.offerPrice),
        category: editForm.category,
        description: editForm.description,  // send description
      };

      const { data } = await axios.put(`/api/product/update/${editingProductId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success('Product updated successfully');

        setProducts((prev) =>
          prev.map((p) => (p._id === editingProductId ? { ...p, ...payload } : p))
        );

        cancelEditing();
      } else {
        toast.error(data.error || 'Failed to update product');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 gap-4">
            <h2 className="text-lg font-medium">All Products</h2>
            {selectedProducts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md whitespace-nowrap"
              >
                Delete Selected ({selectedProducts.length})
              </button>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto bg-white border border-gray-500/20 rounded-md">
            <table className="table-auto w-full min-w-[600px] text-sm">
              <thead className="text-left text-gray-900 bg-gray-50">
                <tr>
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={(e) =>
                        setSelectedProducts(
                          e.target.checked ? products.map((p) => p._id) : []
                        )
                      }
                      aria-label="Select all products"
                    />
                  </th>
                  <th className="px-4 py-3 w-48">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 w-24">Price</th>
                  <th className="px-4 py-3">Description</th> {/* added header */}
                  <th className="px-4 py-3 w-40">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {products.map((product) => (
                  <tr key={product._id} className="border-t align-top">
                    <td className="p-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => toggleSelectProduct(product._id)}
                        aria-label={`Select product ${product.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3 min-w-[150px] align-top">
                      <div className="bg-gray-100 p-2 rounded w-16 h-16 flex-shrink-0">
                        <Image
                          src={product?.images?.[0]}
                          alt={product.name}
                          className="object-cover rounded"
                          width={64}
                          height={64}
                        />
                      </div>

                      {editingProductId === product._id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="truncate max-w-[calc(100%-80px)]">{product.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProductId === product._id ? (
                        <select
                          value={editForm.category}
                          onChange={(e) => handleEditChange('category', e.target.value)}
                          className="outline-none border border-gray-300 rounded px-2 py-1 w-full"
                        >
                          <option value="Earphone">Earphone</option>
                          <option value="Headphone">Headphone</option>
                          <option value="Watch">Watch</option>
                          <option value="Smartphone">Smartphone</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Camera">Camera</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      ) : (
                        product.category
                      )}
                    </td>
                    <td className="px-4 py-3 w-24 align-top">
                      {editingProductId === product._id ? (
                        <>
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => handleEditChange('price', e.target.value)}
                            className="outline-none border border-gray-300 rounded px-2 py-1 w-full"
                          />
                          <input
                            type="number"
                            value={editForm.offerPrice}
                            onChange={(e) => handleEditChange('offerPrice', e.target.value)}
                            className="outline-none border border-gray-300 rounded px-2 py-1 w-full mt-1"
                            placeholder="Offer Price"
                          />
                        </>
                      ) : (
                        <>
                          <div>${product.price}</div>
                          <div className="text-sm text-gray-500">${product.offerPrice}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs align-top">
                      {editingProductId === product._id ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1 resize-y"
                          rows={2}
                          placeholder="Description"
                        />
                      ) : (
                        <div className="text-gray-600 text-sm truncate max-w-xs">{product.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2 align-top">
                      {editingProductId === product._id ? (
                        <>
                          <button
                            onClick={saveUpdate}
                            disabled={updating}
                            className="bg-green-600 text-white px-3 py-1 rounded-md whitespace-nowrap disabled:opacity-50"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={updating}
                            className="bg-gray-300 text-black px-3 py-1 rounded-md whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/product/${product._id}`)}
                            className="bg-orange-600 text-white px-3 py-1 rounded-md whitespace-nowrap"
                          >
                            Visit
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(product._id);
                              setShowModal(true);
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded-md whitespace-nowrap"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => startEditing(product)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md whitespace-nowrap"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden flex flex-col gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="border border-gray-300 rounded-md p-4 bg-white shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => toggleSelectProduct(product._id)}
                    aria-label={`Select product ${product.name}`}
                    className="flex-shrink-0 w-5 h-5"
                  />
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={product?.images?.[0]}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    {editingProductId === product._id ? (
                      <>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1 mb-2"
                        />
                        <select
                          value={editForm.category}
                          onChange={(e) => handleEditChange('category', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1 mb-2"
                        >
                          <option value="Earphone">Earphone</option>
                          <option value="Headphone">Headphone</option>
                          <option value="Watch">Watch</option>
                          <option value="Smartphone">Smartphone</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Camera">Camera</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => handleEditChange('price', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1 mb-2"
                          placeholder="Price"
                        />
                        <input
                          type="number"
                          value={editForm.offerPrice}
                          onChange={(e) => handleEditChange('offerPrice', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1 mb-2"
                          placeholder="Offer Price"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                          className="w-full outline-none border border-gray-300 rounded px-2 py-1 mb-2 resize-y"
                          rows={3}
                          placeholder="Description"
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <p className="text-sm">
                          Price: <span className="font-semibold line-through">${product.price}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Offer: <span>${product.offerPrice}</span>
                        </p>
                        <p className="text-sm text-gray-600 truncate">{product.description}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {editingProductId === product._id ? (
                    <>
                      <button
                        onClick={saveUpdate}
                        disabled={updating}
                        className="flex-grow bg-green-600 text-white py-2 rounded-md disabled:opacity-50"
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={updating}
                        className="flex-grow bg-gray-300 text-black py-2 rounded-md"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/product/${product._id}`)}
                        className="flex-grow bg-orange-600 text-white py-2 rounded-md"
                      >
                        Visit
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(product._id);
                          setShowModal(true);
                        }}
                        className="flex-grow bg-red-600 text-white py-2 rounded-md"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => startEditing(product)}
                        className="flex-grow bg-blue-600 text-white py-2 rounded-md"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white p-6 rounded-md shadow-md text-center max-w-sm w-full">
            <p className="mb-4 text-sm">
              {productToDelete
                ? 'Are you sure you want to delete this product?'
                : `Delete ${selectedProducts.length} selected product(s)?`}
            </p>
            <div className="flex justify-end gap-4 flex-wrap">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md flex-grow sm:flex-grow-0"
                onClick={() => {
                  setShowModal(false);
                  setProductToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md flex-grow sm:flex-grow-0"
                onClick={() => {
                  if (productToDelete) {
                    handleDeleteProduct(productToDelete);
                    setProductToDelete(null);
                    setShowModal(false);
                  } else {
                    confirmBulkDelete();
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductList;
