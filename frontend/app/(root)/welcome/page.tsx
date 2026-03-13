import CreateMasterPassword from "@/app/components/home/welcome/CreateMasterPassword";
import WelcomeHero from "@/app/components/home/welcome/Hero";

const WelcomePage = () => {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-10">
      <div className="border-3 border-slate-500 rounded-2xl py-15 px-15">
        <WelcomeHero />
        <h1 className="text-3xl mt-5 text-center">Welcome to PassGuard!</h1>
        <p className="text-xl mt-4 text-center">
          We are thrilled to have you here. This is your personal password
          manager. You can securely store and manage all your passwords in one
          place.
        </p>
        <p className="text-xl text-center mt-2">
          We also offer other features such as password generation, secure
          notes, to-dos and reminders.
        </p>
        <p className="text-xl text-center mt-2">
          We are committed to keeping your data safe and secure. Your privacy is
          our top priority. We use strong encryption to protect your data and we
          never share it with third parties. We are working on adding more
          features and improving the user experience. If you have any feedback
          or suggestions, please feel free to reach out to us. We are here to
          help you manage your passwords and keep them safe.
        </p>
        <p className="text-xl text-center mt-2">
          We need you to create a master password to unlock your vault and start
          using the app. Your master password is the key to your vault, so make
          sure to choose a strong and unique password that you can remember. We
          recommend using a combination of uppercase and lowercase letters,
          numbers, and special characters. Once you create your master password,
          you will be able to securely store and manage all your passwords in
          one place. Remember, your master password is the only way to access
          your vault, so keep it safe and do not share it with anyone.
        </p>
        <CreateMasterPassword />
      </div>
    </div>
  );
};

export default WelcomePage;
