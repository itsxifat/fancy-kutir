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

  // Keep track of pending deletions to allow undo cancel
  const pendingDeleteTimers = useRef({}); // { productId: timerId }

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

  // Delete after delay with undo option
  const handleDeleteProduct = async (id) => {
    const token = await getToken();

    // Find product to allow undo
    const deletedProduct = products.find((p) => p._id === id);
    if (!deletedProduct) return;

    // Remove immediately from UI
    setProducts((prev) => prev.filter((p) => p._id !== id));

    // Show toast with Undo option
    const toastId = toast(
      (t) => (
        <span>
          Product deleted.
          <button
            className="ml-2 underline"
            onClick={() => {
              // Undo clicked: cancel timer, restore product UI, dismiss toast
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

    // Schedule actual deletion after 4 seconds
    const timerId = setTimeout(async () => {
      try {
        await axios.delete(`/api/product/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        toast.error('Failed to delete product from server.');
        // Optionally, reload products to sync UI
        fetchSellerProduct();
      }
      delete pendingDeleteTimers.current[id];
      toast.dismiss(toastId);
    }, 4000);

    pendingDeleteTimers.current[id] = timerId;
  };

  // The rest of your bulk delete, select toggling, modal, etc.

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

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:p-10 p-4">
          <div className="flex justify-between items-center pb-4">
            <h2 className="text-lg font-medium">All Products</h2>
            {selectedProducts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Delete Selected ({selectedProducts.length})
              </button>
            )}
          </div>
          <div className="flex flex-col items-center max-w-4xl w-full bg-white border border-gray-500/20 rounded-md overflow-hidden">
            <table className="table-fixed w-full text-sm">
              <thead className="text-left text-gray-900 bg-gray-50">
                <tr>
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length}
                      onChange={(e) =>
                        setSelectedProducts(
                          e.target.checked ? products.map((p) => p._id) : []
                        )
                      }
                    />
                  </th>
                  <th className="w-2/3 md:w-2/5 px-4 py-3">Product</th>
                  <th className="px-4 py-3 max-sm:hidden">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3 max-sm:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {products.map((product) => (
                  <tr key={product._id} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => toggleSelectProduct(product._id)}
                      />
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded">
                        <Image
                          src={product?.images?.[0]}
                          alt="product image"
                          className="w-16 h-16 object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                      <span>{product.name}</span>
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">{product.category}</td>
                    <td className="px-4 py-3">${product.offerPrice}</td>
                    <td className="px-4 py-3 max-sm:hidden flex gap-2">
                      <button
                        onClick={() => router.push(`/product/${product._id}`)}
                        className="bg-orange-600 text-white px-3 py-1 rounded-md"
                      >
                        Visit
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(product._id);
                          setShowModal(true);
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded-md"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for confirming delete */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-md shadow-md text-center max-w-sm">
            <p className="mb-4">
              {productToDelete
                ? 'Are you sure you want to delete this product?'
                : `Delete ${selectedProducts.length} selected products?`}
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md"
                onClick={() => {
                  setShowModal(false);
                  setProductToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md"
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
