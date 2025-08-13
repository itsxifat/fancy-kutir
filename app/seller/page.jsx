'use client';
import React, { useState, useEffect, useRef } from "react";
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';
import imageCompression from "browser-image-compression";
import { assets } from "@/assets/assets";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import axios from "axios";

const AddProduct = () => {
  const { isSeller, getToken } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isSeller) {
      router.replace('/');
    }
  }, [isSeller, router]);

  // Store original files for preview and processed files for upload
  const [files, setFiles] = useState([null, null, null, null]);
  const [processedFiles, setProcessedFiles] = useState([null, null, null, null]);

  // Product fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Earphone');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  // Load BodyPix model once
  const bodyPixRef = useRef(null);
  useEffect(() => {
    const loadModel = async () => {
      bodyPixRef.current = await bodyPix.load();
    };
    loadModel();
  }, []);

  // Remove background + compress + add white bg
  const removeBackgroundWithBodyPix = async (file) => {
    if (!bodyPixRef.current) {
      toast.error("Background remover model is not loaded yet");
      return file; // fallback to original
    }

    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);

    // Segment person (or main subject)
    const segmentation = await bodyPixRef.current.segmentPerson(canvas, {
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    });

    const maskBackground = true;
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };  // transparent
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 }; // opaque black

    const mask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Make background pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      if (mask.data[i + 3] === 255) { // background alpha
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Draw white background behind transparent image
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');

    finalCtx.fillStyle = "white";
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);

    // Convert final canvas to blob and compress
    const blob = await new Promise((resolve) => finalCanvas.toBlob(resolve, 'image/jpeg', 1));

    const compressedFile = await imageCompression(blob, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: 0.7,
    });

    return compressedFile;
  };

  // Handle input file change and process image
  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    toast.loading("Removing background and compressing...", { id: "img-process" });
    try {
      const processed = await removeBackgroundWithBodyPix(file);

      // Update processed files for upload
      const updatedProcessed = [...processedFiles];
      updatedProcessed[index] = processed;
      setProcessedFiles(updatedProcessed);

      // Update files for preview
      const updatedFiles = [...files];
      updatedFiles[index] = processed;
      setFiles(updatedFiles);

      toast.success("Image processed", { id: "img-process" });
    } catch (err) {
      toast.error("Image processing failed", { id: "img-process" });
      console.error(err);
    }
  };

  // Form submit with processed images
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSeller) {
      toast.error("Only sellers can add products.");
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('offerPrice', offerPrice);

    for (let i = 0; i < processedFiles.length; i++) {
      if (processedFiles[i]) formData.append('images', processedFiles[i]);
    }

    try {
      const token = await getToken();
      const { data } = await axios.post('/api/product/add', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.error) {
        toast.error(data.error);
      } else if (data.success) {
        toast.success("Product added successfully");
        // Optional: Reset form here
        setName('');
        setDescription('');
        setCategory('Three-piece');
        setPrice('');
        setOfferPrice('');
        setFiles([null, null, null, null]);
        setProcessedFiles([null, null, null, null]);
      }
    } catch (error) {
      toast.error("Failed to add product");
      console.error(error);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input
                  name="images"
                  onChange={(e) => handleFileChange(e, index)}
                  type="file"
                  id={`image${index}`}
                  hidden
                  accept="image/*"
                />
                <Image
                  className="max-w-24 cursor-pointer"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                  key={index}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        {/* Description textarea */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-description">
            Product Description
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>

        {/* Category, price, offerPrice */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="Three-piece">Three Piece</option>
              <option value="Orna">Orna</option>
              <option value="Watch">Watch</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Laptop">Laptop</option>
              <option value="Camera">Camera</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Product Price
            </label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Offer Price
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
            />
          </div>
        </div>

        <button type="submit" className="px-8 py-2.5 bg-orange-600 text-white font-medium rounded">
          ADD
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
