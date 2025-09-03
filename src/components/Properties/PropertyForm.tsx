import React, { useState } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { Property, PropertyType, Unit, CommonAreas } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useTranslation } from '../../hooks/useTranslation';

interface PropertyFormProps {
  onClose: () => void;
  property?: Property;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onClose, property }) => {
  const { t, getCurrencySymbol } = useTranslation();
  const { user } = useAuth();
  const [properties, setProperties] = useLocalStorage<Property[]>('gestionloc_properties', []);
  const [units, setUnits] = useLocalStorage<Unit[]>('gestionloc_units', []);
  const { canAddProperty } = useSubscription();
  
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: {
      street: property?.address?.street || '',
      apartment: property?.address?.apartment || '',
      postalCode: property?.address?.postalCode || '',
      city: property?.address?.city || '',
      province: property?.address?.province || '',
      country: property?.address?.country || 'Canada',
    },
    type: property?.type || 'entire' as PropertyType,
    totalRooms: property?.totalRooms || 1,
    totalBathrooms: property?.totalBathrooms || 1,
    totalArea: property?.totalArea || 0,
    description: property?.description || '',
    rent: property?.rent || 0,
    monthlyMortgage: property?.monthlyMortgage || 0,
    monthlyFixedCharges: property?.monthlyFixedCharges || 0,
    purchasePrice: property?.purchasePrice || 0,
    purchaseDate: property?.purchaseDate ? new Date(property.purchaseDate).toISOString().split('T')[0] : '',
  });

  const [propertyUnits, setPropertyUnits] = useState<Omit<Unit, 'id' | 'propertyId' | 'createdAt'>[]>([
    { name: '', area: 0, rent: 0, status: 'available', availabilitySlots: [], equipment: [] }
  ]);

  const [commonAreas, setCommonAreas] = useState<CommonAreas>({
    kitchen: false,
    fridge: false,
    microwave: false,
    oven: false,
    dishwasher: false,
    bathroom: false,
    laundry: false,
    livingRoom: false,
    wifi: false,
    parking: false,
    balcony: false,
    garden: false,
    storage: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check subscription limits for new properties
    if (!property && !canAddProperty(properties.length)) {
      alert('Vous avez atteint la limite de propriétés pour votre plan. Veuillez mettre à niveau votre abonnement.');
      return;
    }
    
    const propertyData: Property = {
      id: property?.id || Date.now().toString(),
      ownerId: user?.id || '1',
      name: formData.name,
      address: formData.address,
      type: formData.type,
      totalRooms: formData.totalRooms,
      totalBathrooms: formData.totalBathrooms,
      totalArea: formData.totalArea,
      description: formData.description,
      images: [],
      status: 'libre' as const,
      rent: formData.type === 'entire' ? formData.rent : undefined,
      equipment: [], // Can be enhanced later
      commonAreas: formData.type === 'shared' ? commonAreas : undefined,
      monthlyMortgage: formData.monthlyMortgage,
      monthlyFixedCharges: formData.monthlyFixedCharges,
      purchasePrice: formData.purchasePrice || undefined,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
      createdAt: property?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (property) {
      setProperties(prev => prev.map(p => p.id === property.id ? propertyData : p));
    } else {
      setProperties(prev => [...prev, propertyData]);
      
      // Add units if it's a shared property
      if (formData.type === 'shared') {
        const newUnits = propertyUnits.map(unit => ({
          id: Date.now().toString() + Math.random(),
          propertyId: propertyData.id,
          name: unit.name,
          area: unit.area,
          rent: unit.rent,
          status: 'available' as const,
          availabilitySlots: [],
          createdAt: new Date(),
        }));
        setUnits(prev => [...prev, ...newUnits]);
      }
    }
    
    onClose();
  };

  const addUnit = () => {
    setPropertyUnits(prev => [...prev, {
      name: '',
      area: 0,
      rent: 0,
      status: 'available',
      availabilitySlots: [],
      equipment: []
    }]);
  };

  const removeUnit = (index: number) => {
    setPropertyUnits(prev => prev.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: string, value: any) => {
    setPropertyUnits(prev => prev.map((unit, i) => 
      i === index ? { ...unit, [field]: value } : unit
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {property ? 'Modifier la propriété' : 'Ajouter une propriété'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            {/* Property Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la propriété *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {/* Address Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Rue de la Paix"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appartement
                  </label>
                  <input
                    type="text"
                    value={formData.address.apartment}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, apartment: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="App 4B"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, postalCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="H1A 1A1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Montréal"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province *
                  </label>
                  <select
                    value={formData.address.province}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, province: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner une province</option>
                    <option value="AB">Alberta</option>
                    <option value="BC">Colombie-Britannique</option>
                    <option value="MB">Manitoba</option>
                    <option value="NB">Nouveau-Brunswick</option>
                    <option value="NL">Terre-Neuve-et-Labrador</option>
                    <option value="NS">Nouvelle-Écosse</option>
                    <option value="ON">Ontario</option>
                    <option value="PE">Île-du-Prince-Édouard</option>
                    <option value="QC">Québec</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="NT">Territoires du Nord-Ouest</option>
                    <option value="NU">Nunavut</option>
                    <option value="YT">Yukon</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de logement *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="entire"
                  checked={formData.type === 'entire'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PropertyType }))}
                  className="sr-only"
                />
                <div className={`flex-1 text-center ${
                  formData.type === 'entire' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="font-medium">Logement entier</div>
                  <div className="text-sm text-gray-500">Un seul locataire</div>
                </div>
              </label>
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="shared"
                  checked={formData.type === 'shared'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PropertyType }))}
                  className="sr-only"
                />
                <div className={`flex-1 text-center ${
                  formData.type === 'shared' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  <div className="text-2xl mb-2">🛏️</div>
                  <div className="font-medium">Colocation</div>
                  <div className="text-sm text-gray-500">Chambres séparées</div>
                </div>
              </label>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.type === 'entire' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de pièces
                </label>
                <select
                  value={formData.totalRooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalRooms: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1½</option>
                  <option value={2}>2½</option>
                  <option value={3}>3½</option>
                  <option value={4}>4½</option>
                  <option value={5}>5½</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salles de bain
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalBathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, totalBathrooms: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Superficie (m²)
              </label>
              <input
                type="number"
                value={formData.totalArea}
                onChange={(e) => setFormData(prev => ({ ...prev, totalArea: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rent for entire property */}
          {formData.type === 'entire' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loyer mensuel ($)
              </label>
              <input
                type="number"
                value={formData.rent}
                onChange={(e) => setFormData(prev => ({ ...prev, rent: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations financières</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hypothèque mensuelle ($)
                </label>
                <input
                  type="number"
                  value={formData.monthlyMortgage}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyMortgage: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charges fixes mensuelles ($)
                </label>
                <input
                  type="number"
                  value={formData.monthlyFixedCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyFixedCharges: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Taxes municipales, assurance, frais de copropriété, etc.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix d'achat ($) - optionnel
                </label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'achat - optionnel
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Units for shared property */}
          {formData.type === 'shared' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Chambres</h3>
                <button
                  type="button"
                  onClick={addUnit}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une chambre
                </button>
              </div>
              
              {propertyUnits.map((unit, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Chambre {index + 1}</h4>
                    {propertyUnits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom/Numéro
                      </label>
                      <input
                        type="text"
                        value={unit.name}
                        onChange={(e) => updateUnit(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ex: Chambre A"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Superficie (m²)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={unit.area}
                        onChange={(e) => updateUnit(index, 'area', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loyer ($)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={unit.rent}
                        onChange={(e) => updateUnit(index, 'rent', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Common Areas */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Espaces communs</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(commonAreas).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setCommonAreas(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {key === 'kitchen' && 'Cuisine'}
                        {key === 'fridge' && 'Frigo'}
                        {key === 'microwave' && 'Micro-ondes'}
                        {key === 'oven' && 'Four'}
                        {key === 'dishwasher' && 'Lave-vaisselle'}
                        {key === 'bathroom' && 'Salle de bain'}
                        {key === 'laundry' && 'Buanderie'}
                        {key === 'livingRoom' && 'Salon'}
                        {key === 'wifi' && 'WiFi'}
                        {key === 'parking' && 'Parking'}
                        {key === 'balcony' && 'Balcon'}
                        {key === 'garden' && 'Jardin'}
                        {key === 'storage' && 'Rangement'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description de la propriété..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {property ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;