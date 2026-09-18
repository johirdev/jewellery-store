import JewelleryCreate from "@/src/app/components/DashBoard/Menu/JewelleryCreate/JewelleryCreate";
import BreadcrumbLink from "@/src/app/Layout/Admin/BreadcrumbLink/BreadcrumbLink";



const JewelleryCreatePage = () => {
  return (
    <>
      <BreadcrumbLink
        items={[
          { label: "Categories", href: "/dashboard/menu/jewellery-create" },
          { label: "Create Jewellery Item" },
        ]}
      />
      <JewelleryCreate />
    </>
  );
};

export default JewelleryCreatePage;
