import { useEffect, useMemo, useState } from 'react';
import { getWarehouses } from '../warehouses/warehouseApi';
import { fetchProductsApi } from '../products/productApi';

/**
 * Reference data for the document forms.
 *
 * Every operational document names a warehouse, a location inside it and the
 * products on its lines, and the API identifies all three by id. A form that
 * asked for those as free text would produce a document the API rejects, so the
 * options are loaded from the same collections the documents are validated
 * against and the chosen id is what gets submitted.
 *
 * Locations are offered per selected warehouse, because a location code is only
 * unique within its warehouse.
 */

/** The API caps a page at 100 rows; a picker needs the whole catalogue. */
const PRODUCT_PAGE_SIZE = 100;

export const useReferenceData = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [warehouseResponse, productResponse] = await Promise.all([
          getWarehouses(),
          fetchProductsApi({ page: 1, limit: PRODUCT_PAGE_SIZE, sort: 'name_asc' })
        ]);

        if (!active) return;

        setWarehouses(Array.isArray(warehouseResponse?.data) ? warehouseResponse.data : []);
        setProducts(
          Array.isArray(productResponse?.data) ? productResponse.data : []
        );
      } catch (loadError) {
        if (!active) return;

        // A form cannot be filled in without these, so the failure is shown
        // rather than leaving empty selects that look like an empty warehouse.
        setError(loadError?.message || 'Unable to load warehouses and products');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  /** Location codes belonging to one warehouse, for a location picker. */
  const locationsFor = useMemo(
    () => (warehouseId) => {
      const warehouse = warehouses.find((entry) => entry._id === warehouseId);
      return warehouse?.locations || [];
    },
    [warehouses]
  );

  /** Product options, labelled with the unit so quantities read unambiguously. */
  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product._id,
        label: `${product.name} (${product.sku})`,
        unit: product.unit,
        available: product.quantity
      })),
    [products]
  );

  return { warehouses, products, productOptions, locationsFor, loading, error };
};
